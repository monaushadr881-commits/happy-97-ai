// R48 Learning & Training Orchestration.
// This runtime provides Learning Paths that reference existing courses,
// lessons, quizzes, assignments and certificates — never duplicating them.

import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

const PATH_ITEM_TYPES = ['course','lesson','assignment','quiz','library','academy','presentation'] as const;

const createPathSchema = z.object({
  code: z.string().min(2).max(64),
  title: z.string().min(1),
  description: z.string().optional(),
  audience: z.enum(['beginner','intermediate','advanced','founder','manager','employee','developer','dealer','distributor','customer','custom']).default('employee'),
  category: z.enum(['onboarding','training','academy','library','compliance','security','technical','business']),
});
export const createLearningPathFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createPathSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from('learning_paths').insert({
      ...data, created_by: context.userId,
    }).select('*').single();
    if (error) throw error;
    return row;
  });

const publishSchema = z.object({
  pathId: z.string().uuid(),
  status: z.enum(['draft','published','archived']),
});
export const setLearningPathStatusFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => publishSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from('learning_paths')
      .update({ status: data.status }).eq('id', data.pathId).select('*').single();
    if (error) throw error;
    return row;
  });

const addItemSchema = z.object({
  pathId: z.string().uuid(),
  seq: z.number().int().min(1),
  itemType: z.enum(PATH_ITEM_TYPES),
  itemRef: z.string().uuid(),
  title: z.string().min(1),
  required: z.boolean().default(true),
});
export const addLearningPathItemFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => addItemSchema.parse(d))
  .handler(async ({ data, context }) => {
    // Validate the referenced entity exists in its owning runtime.
    const tableMap: Record<string, string> = {
      course: 'courses', lesson: 'lessons', assignment: 'assignments', quiz: 'quizzes',
      library: 'ai_knowledge_documents', academy: 'courses', presentation: 'presentation_sessions',
    };
    const table = tableMap[data.itemType];
    const { data: exists } = await context.supabase.from(table).select('id').eq('id', data.itemRef).maybeSingle();
    if (!exists) throw new Error(`Referenced ${data.itemType} does not exist or is not accessible`);
    const { data: row, error } = await context.supabase.from('learning_path_items').insert({
      path_id: data.pathId, seq: data.seq, item_type: data.itemType,
      item_ref: data.itemRef, title: data.title, required: data.required,
    }).select('*').single();
    if (error) throw error;
    return row;
  });

const listPathsSchema = z.object({
  audience: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['draft','published','archived']).optional(),
  limit: z.number().int().min(1).max(200).default(50),
});
export const listLearningPathsFn = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => listPathsSchema.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    let q = context.supabase.from('learning_paths').select('*').order('updated_at', { ascending: false }).limit(data.limit);
    if (data.audience) q = q.eq('audience', data.audience);
    if (data.category) q = q.eq('category', data.category);
    if (data.status) q = q.eq('status', data.status);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

const getPathSchema = z.object({ pathId: z.string().uuid() });
export const getLearningPathFn = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => getPathSchema.parse(d))
  .handler(async ({ data, context }) => {
    const [{ data: path, error: pErr }, { data: items, error: iErr }] = await Promise.all([
      context.supabase.from('learning_paths').select('*').eq('id', data.pathId).single(),
      context.supabase.from('learning_path_items').select('*').eq('path_id', data.pathId).order('seq'),
    ]);
    if (pErr) throw pErr;
    if (iErr) throw iErr;
    return { path, items: items ?? [] };
  });

// Progress aggregation reuses existing course_enrollments & lesson_progress
const progressSchema = z.object({ pathId: z.string().uuid(), userId: z.string().uuid().nullish() });
export const computeLearningPathProgressFn = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => progressSchema.parse(d))
  .handler(async ({ data, context }) => {
    const targetUser = data.userId ?? context.userId;
    const { data: items, error } = await context.supabase.from('learning_path_items')
      .select('*').eq('path_id', data.pathId).order('seq');
    if (error) throw error;
    const results: any[] = [];
    for (const item of items ?? []) {
      let done = false;
      if (item.item_type === 'course') {
        const { data: e } = await context.supabase.from('course_enrollments')
          .select('status').eq('course_id', item.item_ref).eq('user_id', targetUser).maybeSingle();
        done = /complet/i.test(String(e?.status ?? ''));
      } else if (item.item_type === 'lesson') {
        const { data: p } = await context.supabase.from('lesson_progress')
          .select('status').eq('lesson_id', item.item_ref).eq('user_id', targetUser).maybeSingle();
        done = /complet/i.test(String(p?.status ?? ''));
      } else if (item.item_type === 'quiz') {
        const { data: a } = await context.supabase.from('quiz_attempts')
          .select('score,passed').eq('quiz_id', item.item_ref).eq('user_id', targetUser)
          .order('created_at', { ascending: false }).limit(1).maybeSingle();
        done = Boolean(a?.passed);
      } else if (item.item_type === 'assignment') {
        const { data: s } = await context.supabase.from('assignment_submissions')
          .select('status').eq('assignment_id', item.item_ref).eq('user_id', targetUser).maybeSingle();
        done = /submit|complet|grade/i.test(String(s?.status ?? ''));
      }
      results.push({ item_id: item.id, seq: item.seq, type: item.item_type, done, required: item.required });
    }
    const required = results.filter((r) => r.required);
    const completed = required.filter((r) => r.done);
    return {
      path_id: data.pathId,
      user_id: targetUser,
      items: results,
      total: results.length,
      required: required.length,
      completed: completed.length,
      completion_rate: required.length ? completed.length / required.length : 0,
    };
  });
