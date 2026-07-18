# HAPPY Master Feature Registry

**Status:** LOCKED — R111. Searchable via `grep -F 'F0123' docs/registry/FEATURE_REGISTRY.md`.

| ID | Feature | Module | Priority | Owner | Deps | Status | Phase | Credits | Subscription | Enterprise |
|---|---|---|---|---|---|---|---|---|---|---|
| F0001 | HAPPY runtime mount | happy-desk | P0 | HappyDesk.tsx | - | ✅ | Live | 0 | free | included |
| F0002 | Streaming chat | happy-chat | P0 | happy-chat.functions.ts | LOVABLE_API_KEY | ✅ | Live | 1/msg | free | included |
| F0003 | TTS | dh-tts | P0 | api/dh.tts.ts | LOVABLE_API_KEY | ✅ | Live | 1/utt | free | included |
| F0004 | STT fallback | happy-stt | P0 | api/happy-stt.ts | LOVABLE_API_KEY | ✅ | Live | 1/clip | free | included |
| F0005 | VRM renderer | digital-human | P0 | HappyVRM.tsx | three,@pixiv/three-vrm | ✅ | Live | 0 | free | included |
| F0006 | Voice fallback | voice | P1 | voice-fallback.ts | - | ✅ | Live | 0 | free | included |
| F0007 | Interrupt recovery | voice | P1 | useVoiceInput.ts | - | ✅ | Live | 0 | free | included |
| F0008 | Natural lip-sync | dh-anim | P1 | HappyVRM.tsx | audio-bus | ✅ | Live | 0 | free | included |
| F0009 | Natural blinking | dh-anim | P1 | HappyVRM.tsx (R112 ext) | - | 🟡 | P1 | 0 | free | included |
| F0010 | Idle breathing | dh-anim | P1 | HappyVRM.tsx (R112 ext) | - | 🟡 | P1 | 0 | free | included |
| F0011 | Head tracking | dh-anim | P1 | HappyVRM.tsx | - | ✅ | Live | 0 | free | included |
| F0012 | Whiteboard mode | dh-mode | P2 | Whiteboard.tsx | - | ✅ | Live | 0 | pro | included |
| F0013 | Presentation mode | dh-mode | P2 | conversation-engine | - | 🟡 | P2 | 0 | pro | included |
| F0014 | Roadmap mode | dh-mode | P3 | conversation-engine (R112) | - | 🔴 | P3 | 0 | pro | included |
| F0015 | Consultant mode | dh-mode | P2 | persona.ts | - | ✅ | Live | 1/turn | pro | included |
| F0016 | Friend mode | dh-mode | P2 | persona.ts | - | ✅ | Live | 0 | free | included |
| F0017 | Brain unified context | brain | P1 | brain/context.ts (R112 ext) | brain-v4 | 🟡 | P1 | 0 | free | included |
| F0018 | Memory long-term | memory | P1 | memory_items | - | ✅ | Live | 0 | free | included |
| F0019 | Memory short-term | memory | P1 | brain_sessions | - | ✅ | Live | 0 | free | included |
| F0020 | Conversation recall | memory | P1 | agent_messages | - | ✅ | Live | 0 | free | included |
| F0021 | Universal search | search | P1 | kg_search_cache | - | ✅ | Live | 0 | free | included |
| F0022 | Resumable uploads | files | P1 | files/upload.ts (R112 ext) | storage buckets | 🟡 | P1 | 0 | free | included |
| F0023 | Streaming upload | files | P1 | files/upload.ts | - | 🟡 | P1 | 0 | free | included |
| F0024 | OCR / AI summary | files | P2 | files/ai.ts | LOVABLE_API_KEY | 🔴 | P2 | 1/doc | pro | included |
| F0025 | Workspace unlimited | workspace | P1 | workspaces | policy R112 | ✅ | Live | 0 | enterprise | included |
| F0026 | Founder dashboard | founder | P0 | founder/ | - | ✅ | Live | 0 | free | included |
| F0027 | Builder | builder | P1 | app-builder | - | ✅ | Live | 0 | pro | included |
| F0028 | Creator Studio | creator | P1 | creator-v1 | - | ✅ | Live | 0 | pro | included |
| F0029 | Marketplace | marketplace | P2 | listings | - | ✅ | Live | 1/txn | free | included |
| F0030 | Credits ledger | credits | P0 | credit_ledger_entries | - | ✅ | Live | - | free | included |
| F0031 | Subscriptions | subscriptions | P0 | subscriptions | - | ✅ | Live | - | free | included |
| F0032 | achievements | achievements | P2 | _authenticated/achievements.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0033 | admin | admin | P2 | _authenticated/admin.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0034 | agent-os | agent-os | P2 | _authenticated/agent-os.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0035 | agents / collaboration / analytics | agents | P2 | _authenticated/agents.collaboration.analytics.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0036 | agents / collaboration / history | agents | P2 | _authenticated/agents.collaboration.history.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0037 | agents / collaboration / live | agents | P2 | _authenticated/agents.collaboration.live.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0038 | agents / collaboration | agents | P2 | _authenticated/agents.collaboration.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0039 | agents / execution | agents | P2 | _authenticated/agents.execution.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0040 | agents / metrics | agents | P2 | _authenticated/agents.metrics.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0041 | agents / runtime | agents | P2 | _authenticated/agents.runtime.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0042 | agents | agents | P2 | _authenticated/agents.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0043 | ai-design | ai-design | P2 | _authenticated/ai-design.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0044 | analytics | analytics | P2 | _authenticated/analytics.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0045 | api-fabric | api-fabric | P2 | _authenticated/api-fabric.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0046 | appointments | appointments | P2 | _authenticated/appointments.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0047 | apps | apps | P2 | _authenticated/apps.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0048 | assets | assets | P2 | _authenticated/assets.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0049 | assistant | assistant | P2 | _authenticated/assistant.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0050 | automation-hub | automation-hub | P2 | _authenticated/automation-hub.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0051 | automation | automation | P2 | _authenticated/automation.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0052 | autonomous | autonomous | P2 | _authenticated/autonomous.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0053 | banking | banking | P2 | _authenticated/banking.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0054 | billing | billing | P2 | _authenticated/billing.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0055 | brain / analytics | brain | P2 | _authenticated/brain.analytics.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0056 | brain / execution | brain | P2 | _authenticated/brain.execution.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0057 | brain / health | brain | P2 | _authenticated/brain.health.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0058 | brain / index | brain | P2 | _authenticated/brain.index.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0059 | brain / memory | brain | P2 | _authenticated/brain.memory.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0060 | brain / planning | brain | P2 | _authenticated/brain.planning.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0061 | brain / reasoning | brain | P2 | _authenticated/brain.reasoning.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0062 | brain / reflection | brain | P2 | _authenticated/brain.reflection.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0063 | brain / runtime | brain | P2 | _authenticated/brain.runtime.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0064 | brain | brain | P2 | _authenticated/brain.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0065 | brain / validation | brain | P2 | _authenticated/brain.validation.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0066 | builder | builder | P2 | _authenticated/builder.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0067 | business / ai | business | P2 | _authenticated/business.ai.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0068 | business / analytics | business | P2 | _authenticated/business.analytics.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0069 | business / automation | business | P2 | _authenticated/business.automation.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0070 | business / crm | business | P2 | _authenticated/business.crm.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0071 | business / finance | business | P2 | _authenticated/business.finance.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0072 | business / hr | business | P2 | _authenticated/business.hr.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0073 | business / index | business | P2 | _authenticated/business.index.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0074 | business / inventory | business | P2 | _authenticated/business.inventory.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0075 | business / manufacturing | business | P2 | _authenticated/business.manufacturing.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0076 | business / projects | business | P2 | _authenticated/business.projects.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0077 | business / purchase | business | P2 | _authenticated/business.purchase.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0078 | business / sales | business | P2 | _authenticated/business.sales.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0079 | business / search | business | P2 | _authenticated/business.search.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0080 | business | business | P2 | _authenticated/business.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0081 | business / warehouse | business | P2 | _authenticated/business.warehouse.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0082 | citizens | citizens | P2 | _authenticated/citizens.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0083 | cloud / analytics | cloud | P2 | _authenticated/cloud.analytics.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0084 | cloud / billing | cloud | P2 | _authenticated/cloud.billing.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0085 | cloud / compliance | cloud | P2 | _authenticated/cloud.compliance.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0086 | cloud / deployments | cloud | P2 | _authenticated/cloud.deployments.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0087 | cloud / marketplace | cloud | P2 | _authenticated/cloud.marketplace.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0088 | cloud / models | cloud | P2 | _authenticated/cloud.models.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0089 | cloud / projects | cloud | P2 | _authenticated/cloud.projects.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0090 | cloud / storage | cloud | P2 | _authenticated/cloud.storage.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0091 | cloud | cloud | P2 | _authenticated/cloud.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0092 | coach | coach | P2 | _authenticated/coach.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0093 | collaboration | collaboration | P2 | _authenticated/collaboration.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0094 | commerce | commerce | P2 | _authenticated/commerce.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0095 | communications | communications | P2 | _authenticated/communications.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0096 | community / following | community | P2 | _authenticated/community.following.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0097 | community / groups | community | P2 | _authenticated/community.groups.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0098 | community / index | community | P2 | _authenticated/community.index.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0099 | community / mine | community | P2 | _authenticated/community.mine.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0100 | community | community | P2 | _authenticated/community.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0101 | connectivity | connectivity | P2 | _authenticated/connectivity.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0102 | connectors | connectors | P2 | _authenticated/connectors.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0103 | content | content | P2 | _authenticated/content.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0104 | credits | credits | P2 | _authenticated/credits.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0105 | crm | crm | P2 | _authenticated/crm.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0106 | customer | customer | P2 | _authenticated/customer.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0107 | customer360 | customer360 | P2 | _authenticated/customer360.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0108 | customers | customers | P2 | _authenticated/customers.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0109 | dashboard | dashboard | P2 | _authenticated/dashboard.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0110 | data-exchange | data-exchange | P2 | _authenticated/data-exchange.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0111 | data-fabric | data-fabric | P2 | _authenticated/data-fabric.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0112 | dealer | dealer | P2 | _authenticated/dealer.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0113 | decision / analytics | decision | P2 | _authenticated/decision.analytics.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0114 | decision / history | decision | P2 | _authenticated/decision.history.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0115 | decision / scenarios | decision | P2 | _authenticated/decision.scenarios.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0116 | decision | decision | P2 | _authenticated/decision.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0117 | deploy | deploy | P2 | _authenticated/deploy.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0118 | developer | developer | P2 | _authenticated/developer.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0119 | developers / apis | developers | P2 | _authenticated/developers.apis.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0120 | developers / docs | developers | P2 | _authenticated/developers.docs.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0121 | developers / sdk | developers | P2 | _authenticated/developers.sdk.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0122 | developers | developers | P2 | _authenticated/developers.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0123 | developers / webhooks | developers | P2 | _authenticated/developers.webhooks.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0124 | devices | devices | P2 | _authenticated/devices.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0125 | digital-factory | digital-factory | P2 | _authenticated/digital-factory.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0126 | digital-human / boardroom | digital-human | P2 | _authenticated/digital-human.boardroom.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0127 | digital-human / classroom | digital-human | P2 | _authenticated/digital-human.classroom.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0128 | digital-human / index | digital-human | P2 | _authenticated/digital-human.index.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0129 | digital-human / presentation | digital-human | P2 | _authenticated/digital-human.presentation.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0130 | digital-human / sessions | digital-human | P2 | _authenticated/digital-human.sessions.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0131 | digital-human / settings | digital-human | P2 | _authenticated/digital-human.settings.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0132 | digital-human | digital-human | P2 | _authenticated/digital-human.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0133 | digital-human / whiteboard | digital-human | P2 | _authenticated/digital-human.whiteboard.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0134 | digital-twin-v2 | digital-twin-v2 | P2 | _authenticated/digital-twin-v2.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0135 | digital-twin | digital-twin | P2 | _authenticated/digital-twin.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0136 | distributor | distributor | P2 | _authenticated/distributor.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0137 | documents | documents | P2 | _authenticated/documents.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0138 | domains-manage | domains-manage | P2 | _authenticated/domains-manage.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0139 | domains-search | domains-search | P2 | _authenticated/domains-search.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0140 | domains | domains | P2 | _authenticated/domains.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0141 | ecosystem-hub | ecosystem-hub | P2 | _authenticated/ecosystem-hub.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0142 | ecosystem-intelligence | ecosystem-intelligence | P2 | _authenticated/ecosystem-intelligence.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0143 | ecosystem | ecosystem | P2 | _authenticated/ecosystem.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0144 | edge | edge | P2 | _authenticated/edge.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0145 | education / analytics | education | P2 | _authenticated/education.analytics.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0146 | education / certificates | education | P2 | _authenticated/education.certificates.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0147 | education / creator | education | P2 | _authenticated/education.creator.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0148 | education / exams | education | P2 | _authenticated/education.exams.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0149 | education / flashcards | education | P2 | _authenticated/education.flashcards.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0150 | education / index | education | P2 | _authenticated/education.index.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0151 | education / library | education | P2 | _authenticated/education.library.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0152 | education / my | education | P2 | _authenticated/education.my.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0153 | education / notes | education | P2 | _authenticated/education.notes.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0154 | education / plans | education | P2 | _authenticated/education.plans.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0155 | education / search | education | P2 | _authenticated/education.search.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0156 | education | education | P2 | _authenticated/education.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0157 | education / tutor | education | P2 | _authenticated/education.tutor.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0158 | employee | employee | P2 | _authenticated/employee.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0159 | energy | energy | P2 | _authenticated/energy.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0160 | enterprise-cloud | enterprise-cloud | P2 | _authenticated/enterprise-cloud.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0161 | enterprise-network | enterprise-network | P2 | _authenticated/enterprise-network.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0162 | enterprise / ai | enterprise | P2 | _authenticated/enterprise.ai.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0163 | enterprise / business | enterprise | P2 | _authenticated/enterprise.business.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0164 | enterprise / comms | enterprise | P2 | _authenticated/enterprise.comms.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0165 | enterprise / content | enterprise | P2 | _authenticated/enterprise.content.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0166 | enterprise / customers | enterprise | P2 | _authenticated/enterprise.customers.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0167 | enterprise / index | enterprise | P2 | _authenticated/enterprise.index.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0168 | enterprise / people | enterprise | P2 | _authenticated/enterprise.people.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0169 | enterprise / reports | enterprise | P2 | _authenticated/enterprise.reports.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0170 | enterprise / security | enterprise | P2 | _authenticated/enterprise.security.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0171 | enterprise / structure | enterprise | P2 | _authenticated/enterprise.structure.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0172 | enterprise | enterprise | P2 | _authenticated/enterprise.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0173 | enterprise / workflows | enterprise | P2 | _authenticated/enterprise.workflows.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0174 | erp | erp | P2 | _authenticated/erp.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0175 | events | events | P2 | _authenticated/events.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0176 | execution / analytics | execution | P2 | _authenticated/execution.analytics.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0177 | execution / history | execution | P2 | _authenticated/execution.history.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0178 | execution / tasks | execution | P2 | _authenticated/execution.tasks.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0179 | execution | execution | P2 | _authenticated/execution.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0180 | executive | executive | P2 | _authenticated/executive.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0181 | experience-fabric | experience-fabric | P2 | _authenticated/experience-fabric.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0182 | experience | experience | P2 | _authenticated/experience.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0183 | fabric | fabric | P2 | _authenticated/fabric.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0184 | factory | factory | P2 | _authenticated/factory.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0185 | finance | finance | P2 | _authenticated/finance.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0186 | financial-ai | financial-ai | P2 | _authenticated/financial-ai.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0187 | fleet | fleet | P2 | _authenticated/fleet.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0188 | focus | focus | P2 | _authenticated/focus.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0189 | founder / ai | founder | P2 | _authenticated/founder.ai.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0190 | founder / analytics | founder | P2 | _authenticated/founder.analytics.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0191 | founder / companies | founder | P2 | _authenticated/founder.companies.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0192 | founder / index | founder | P2 | _authenticated/founder.index.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0193 | founder / ops | founder | P2 | _authenticated/founder.ops.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0194 | founder / security | founder | P2 | _authenticated/founder.security.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0195 | founder / system | founder | P2 | _authenticated/founder.system.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0196 | founder | founder | P2 | _authenticated/founder.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0197 | founder / users | founder | P2 | _authenticated/founder.users.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0198 | future | future | P2 | _authenticated/future.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0199 | global-memory | global-memory | P2 | _authenticated/global-memory.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0200 | global | global | P2 | _authenticated/global.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0201 | governance-v2 | governance-v2 | P2 | _authenticated/governance-v2.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0202 | governance | governance | P2 | _authenticated/governance.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0203 | government | government | P2 | _authenticated/government.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0204 | healthcare | healthcare | P2 | _authenticated/healthcare.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0205 | home | home | P2 | _authenticated/home.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0206 | hospitals | hospitals | P2 | _authenticated/hospitals.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0207 | hosting | hosting | P2 | _authenticated/hosting.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0208 | hrms | hrms | P2 | _authenticated/hrms.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0209 | hyperlocal / alerts | hyperlocal | P2 | _authenticated/hyperlocal.alerts.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0210 | hyperlocal / ask | hyperlocal | P2 | _authenticated/hyperlocal.ask.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0211 | hyperlocal / businesses | hyperlocal | P2 | _authenticated/hyperlocal.businesses.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0212 | hyperlocal / discover | hyperlocal | P2 | _authenticated/hyperlocal.discover.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0213 | hyperlocal / events | hyperlocal | P2 | _authenticated/hyperlocal.events.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0214 | hyperlocal / index | hyperlocal | P2 | _authenticated/hyperlocal.index.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0215 | hyperlocal / jobs | hyperlocal | P2 | _authenticated/hyperlocal.jobs.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0216 | hyperlocal / manage | hyperlocal | P2 | _authenticated/hyperlocal.manage.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0217 | hyperlocal / map | hyperlocal | P2 | _authenticated/hyperlocal.map.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0218 | hyperlocal / settings | hyperlocal | P2 | _authenticated/hyperlocal.settings.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0219 | hyperlocal | hyperlocal | P2 | _authenticated/hyperlocal.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0220 | icons | icons | P2 | _authenticated/icons.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0221 | identity | identity | P2 | _authenticated/identity.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0222 | industry | industry | P2 | _authenticated/industry.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0223 | innovation | innovation | P2 | _authenticated/innovation.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0224 | insights | insights | P2 | _authenticated/insights.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0225 | intelligence-exchange | intelligence-exchange | P2 | _authenticated/intelligence-exchange.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0226 | intelligence-network | intelligence-network | P2 | _authenticated/intelligence-network.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0227 | intelligence / advisor | intelligence | P2 | _authenticated/intelligence.advisor.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0228 | intelligence / dashboard | intelligence | P2 | _authenticated/intelligence.dashboard.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0229 | intelligence / executive | intelligence | P2 | _authenticated/intelligence.executive.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0230 | intelligence / forecast | intelligence | P2 | _authenticated/intelligence.forecast.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0231 | intelligence / insights | intelligence | P2 | _authenticated/intelligence.insights.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0232 | intelligence / live | intelligence | P2 | _authenticated/intelligence.live.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0233 | intelligence / opportunities | intelligence | P2 | _authenticated/intelligence.opportunities.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0234 | intelligence / overview | intelligence | P2 | _authenticated/intelligence.overview.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0235 | intelligence / recommendations | intelligence | P2 | _authenticated/intelligence.recommendations.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0236 | intelligence / reports | intelligence | P2 | _authenticated/intelligence.reports.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0237 | intelligence / risk | intelligence | P2 | _authenticated/intelligence.risk.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0238 | intelligence / runtime | intelligence | P2 | _authenticated/intelligence.runtime.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0239 | intelligence / settings | intelligence | P2 | _authenticated/intelligence.settings.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0240 | intelligence | intelligence | P2 | _authenticated/intelligence.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0241 | investors | investors | P2 | _authenticated/investors.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0242 | iot-runtime | iot-runtime | P2 | _authenticated/iot-runtime.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0243 | iot | iot | P2 | _authenticated/iot.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0244 | knowledge-exchange | knowledge-exchange | P2 | _authenticated/knowledge-exchange.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0245 | knowledge-graph | knowledge-graph | P2 | _authenticated/knowledge-graph.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0246 | knowledge-network | knowledge-network | P2 | _authenticated/knowledge-network.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0247 | knowledge / ask | knowledge | P2 | _authenticated/knowledge.ask.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0248 | knowledge / index | knowledge | P2 | _authenticated/knowledge.index.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0249 | knowledge / library | knowledge | P2 | _authenticated/knowledge.library.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0250 | knowledge / moderation | knowledge | P2 | _authenticated/knowledge.moderation.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0251 | knowledge / religion-culture | knowledge | P2 | _authenticated/knowledge.religion-culture.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0252 | knowledge / search | knowledge | P2 | _authenticated/knowledge.search.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0253 | knowledge / sources | knowledge | P2 | _authenticated/knowledge.sources.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0254 | knowledge | knowledge | P2 | _authenticated/knowledge.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0255 | laboratory | laboratory | P2 | _authenticated/laboratory.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0256 | learning-network | learning-network | P2 | _authenticated/learning-network.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0257 | learning | learning | P2 | _authenticated/learning.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0258 | library | library | P2 | _authenticated/library.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0259 | live-island | live-island | P2 | _authenticated/live-island.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0260 | maintenance | maintenance | P2 | _authenticated/maintenance.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0261 | manufacturing | manufacturing | P2 | _authenticated/manufacturing.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0262 | market-intelligence | market-intelligence | P2 | _authenticated/market-intelligence.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0263 | market-network | market-network | P2 | _authenticated/market-network.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0264 | marketplace-hub | marketplace-hub | P2 | _authenticated/marketplace-hub.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0265 | marketplace / index | marketplace | P2 | _authenticated/marketplace.index.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0266 | marketplace / orders | marketplace | P2 | _authenticated/marketplace.orders.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0267 | marketplace / sales | marketplace | P2 | _authenticated/marketplace.sales.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0268 | marketplace / seller | marketplace | P2 | _authenticated/marketplace.seller.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0269 | marketplace | marketplace | P2 | _authenticated/marketplace.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0270 | medical-research | medical-research | P2 | _authenticated/medical-research.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0271 | memory / dashboard | memory | P2 | _authenticated/memory.dashboard.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0272 | memory / preferences | memory | P2 | _authenticated/memory.preferences.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0273 | memory / search | memory | P2 | _authenticated/memory.search.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0274 | memory / settings | memory | P2 | _authenticated/memory.settings.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0275 | memory / timeline | memory | P2 | _authenticated/memory.timeline.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0276 | memory | memory | P2 | _authenticated/memory.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0277 | messages / index | messages | P2 | _authenticated/messages.index.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0278 | messages | messages | P2 | _authenticated/messages.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0279 | monitoring | monitoring | P2 | _authenticated/monitoring.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0280 | multimodal | multimodal | P2 | _authenticated/multimodal.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0281 | national | national | P2 | _authenticated/national.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0282 | native | native | P2 | _authenticated/native.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0283 | network | network | P2 | _authenticated/network.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0284 | notifications-analytics | notifications-analytics | P2 | _authenticated/notifications-analytics.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0285 | notifications-announcements | notifications-announcements | P2 | _authenticated/notifications-announcements.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0286 | notifications-archive | notifications-archive | P2 | _authenticated/notifications-archive.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0287 | notifications-automation | notifications-automation | P2 | _authenticated/notifications-automation.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0288 | notifications-categories | notifications-categories | P2 | _authenticated/notifications-categories.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0289 | notifications-history | notifications-history | P2 | _authenticated/notifications-history.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0290 | notifications-inbox | notifications-inbox | P2 | _authenticated/notifications-inbox.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0291 | notifications-preferences | notifications-preferences | P2 | _authenticated/notifications-preferences.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0292 | notifications-reminders | notifications-reminders | P2 | _authenticated/notifications-reminders.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0293 | notifications-settings | notifications-settings | P2 | _authenticated/notifications-settings.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0294 | notifications-starred | notifications-starred | P2 | _authenticated/notifications-starred.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0295 | notifications-templates | notifications-templates | P2 | _authenticated/notifications-templates.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0296 | notifications | notifications | P2 | _authenticated/notifications.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0297 | observability-v2 | observability-v2 | P2 | _authenticated/observability-v2.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0298 | observability-v3 | observability-v3 | P2 | _authenticated/observability-v3.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0299 | observability | observability | P2 | _authenticated/observability.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0300 | operations | operations | P2 | _authenticated/operations.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0301 | orchestration | orchestration | P2 | _authenticated/orchestration.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0302 | organizations | organizations | P2 | _authenticated/organizations.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0303 | partners | partners | P2 | _authenticated/partners.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0304 | patients | patients | P2 | _authenticated/patients.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0305 | payments | payments | P2 | _authenticated/payments.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0306 | pharmacy | pharmacy | P2 | _authenticated/pharmacy.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0307 | platform-hub | platform-hub | P2 | _authenticated/platform-hub.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0308 | plugins / installed | plugins | P2 | _authenticated/plugins.installed.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0309 | plugins / manage | plugins | P2 | _authenticated/plugins.manage.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0310 | plugins / reviews | plugins | P2 | _authenticated/plugins.reviews.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0311 | plugins / settings | plugins | P2 | _authenticated/plugins.settings.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0312 | plugins / store | plugins | P2 | _authenticated/plugins.store.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0313 | plugins | plugins | P2 | _authenticated/plugins.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0314 | predictions | predictions | P2 | _authenticated/predictions.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0315 | pricing | pricing | P2 | _authenticated/pricing.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0316 | productivity | productivity | P2 | _authenticated/productivity.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0317 | profile | profile | P2 | _authenticated/profile.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0318 | public-education | public-education | P2 | _authenticated/public-education.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0319 | public-health | public-health | P2 | _authenticated/public-health.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0320 | public-safety | public-safety | P2 | _authenticated/public-safety.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0321 | quality | quality | P2 | _authenticated/quality.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0322 | research | research | P2 | _authenticated/research.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0323 | roadmap | roadmap | P2 | _authenticated/roadmap.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0324 | robotics | robotics | P2 | _authenticated/robotics.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0325 | robots | robots | P2 | _authenticated/robots.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0326 | route | route | P2 | _authenticated/route.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0327 | runtime / analytics | runtime | P2 | _authenticated/runtime.analytics.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0328 | runtime / automation | runtime | P2 | _authenticated/runtime.automation.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0329 | runtime / capabilities | runtime | P2 | _authenticated/runtime.capabilities.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0330 | runtime / collaboration | runtime | P2 | _authenticated/runtime.collaboration.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0331 | runtime / dashboard | runtime | P2 | _authenticated/runtime.dashboard.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0332 | runtime / decision | runtime | P2 | _authenticated/runtime.decision.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0333 | runtime / dependencies | runtime | P2 | _authenticated/runtime.dependencies.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0334 | runtime / developers | runtime | P2 | _authenticated/runtime.developers.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0335 | runtime / execution | runtime | P2 | _authenticated/runtime.execution.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0336 | runtime / executions | runtime | P2 | _authenticated/runtime.executions.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0337 | runtime / goals | runtime | P2 | _authenticated/runtime.goals.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0338 | runtime / health | runtime | P2 | _authenticated/runtime.health.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0339 | runtime / history | runtime | P2 | _authenticated/runtime.history.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0340 | runtime / intelligence / advisor | runtime | P2 | _authenticated/runtime.intelligence.advisor.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0341 | runtime / intelligence / forecast | runtime | P2 | _authenticated/runtime.intelligence.forecast.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0342 | runtime / intelligence / opportunities | runtime | P2 | _authenticated/runtime.intelligence.opportunities.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0343 | runtime / intelligence / recommendations | runtime | P2 | _authenticated/runtime.intelligence.recommendations.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0344 | runtime / intelligence | runtime | P2 | _authenticated/runtime.intelligence.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0345 | runtime / live | runtime | P2 | _authenticated/runtime.live.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0346 | runtime / logs | runtime | P2 | _authenticated/runtime.logs.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0347 | runtime / memory | runtime | P2 | _authenticated/runtime.memory.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0348 | runtime / monitor | runtime | P2 | _authenticated/runtime.monitor.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0349 | runtime / performance | runtime | P2 | _authenticated/runtime.performance.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0350 | runtime / planner | runtime | P2 | _authenticated/runtime.planner.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0351 | runtime / planning | runtime | P2 | _authenticated/runtime.planning.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0352 | runtime / plugins | runtime | P2 | _authenticated/runtime.plugins.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0353 | runtime / risks | runtime | P2 | _authenticated/runtime.risks.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0354 | runtime / security | runtime | P2 | _authenticated/runtime.security.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0355 | runtime / settings | runtime | P2 | _authenticated/runtime.settings.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0356 | runtime / skills | runtime | P2 | _authenticated/runtime.skills.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0357 | runtime / timeline | runtime | P2 | _authenticated/runtime.timeline.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0358 | runtime / tools / analytics | runtime | P2 | _authenticated/runtime.tools.analytics.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0359 | runtime / tools / history | runtime | P2 | _authenticated/runtime.tools.history.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0360 | runtime / tools / live | runtime | P2 | _authenticated/runtime.tools.live.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0361 | runtime / tools | runtime | P2 | _authenticated/runtime.tools.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0362 | runtime | runtime | P2 | _authenticated/runtime.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0363 | runtime / workflows / analytics | runtime | P2 | _authenticated/runtime.workflows.analytics.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0364 | runtime / workflows / history | runtime | P2 | _authenticated/runtime.workflows.history.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0365 | runtime / workflows / live | runtime | P2 | _authenticated/runtime.workflows.live.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0366 | runtime / workflows | runtime | P2 | _authenticated/runtime.workflows.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0367 | rural | rural | P2 | _authenticated/rural.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0368 | search-hub | search-hub | P2 | _authenticated/search-hub.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0369 | search-v2 | search-v2 | P2 | _authenticated/search-v2.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0370 | search | search | P2 | _authenticated/search.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0371 | security | security | P2 | _authenticated/security.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0372 | service-mesh | service-mesh | P2 | _authenticated/service-mesh.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0373 | settings-accessibility | settings-accessibility | P2 | _authenticated/settings-accessibility.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0374 | settings-appearance | settings-appearance | P2 | _authenticated/settings-appearance.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0375 | settings-background | settings-background | P2 | _authenticated/settings-background.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0376 | settings-theme | settings-theme | P2 | _authenticated/settings-theme.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0377 | settings-wallpapers | settings-wallpapers | P2 | _authenticated/settings-wallpapers.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0378 | settings | settings | P2 | _authenticated/settings.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0379 | simulation | simulation | P2 | _authenticated/simulation.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0380 | skills / categories | skills | P2 | _authenticated/skills.categories.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0381 | skills / installed | skills | P2 | _authenticated/skills.installed.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0382 | skills / settings | skills | P2 | _authenticated/skills.settings.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0383 | skills / store | skills | P2 | _authenticated/skills.store.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0384 | skills | skills | P2 | _authenticated/skills.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0385 | smart-city | smart-city | P2 | _authenticated/smart-city.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0386 | streaks | streaks | P2 | _authenticated/streaks.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0387 | studio / assets | studio | P2 | _authenticated/studio.assets.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0388 | studio / brand | studio | P2 | _authenticated/studio.brand.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0389 | studio / copy | studio | P2 | _authenticated/studio.copy.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0390 | studio / exports | studio | P2 | _authenticated/studio.exports.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0391 | studio / image | studio | P2 | _authenticated/studio.image.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0392 | studio / index | studio | P2 | _authenticated/studio.index.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0393 | studio / marketing | studio | P2 | _authenticated/studio.marketing.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0394 | studio / presentation | studio | P2 | _authenticated/studio.presentation.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0395 | studio / projects | studio | P2 | _authenticated/studio.projects.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0396 | studio | studio | P2 | _authenticated/studio.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0397 | studio / voice | studio | P2 | _authenticated/studio.voice.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0398 | super-intelligence | super-intelligence | P2 | _authenticated/super-intelligence.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0399 | supply-chain | supply-chain | P2 | _authenticated/supply-chain.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0400 | support | support | P2 | _authenticated/support.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0401 | sustainability | sustainability | P2 | _authenticated/sustainability.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0402 | telemedicine | telemedicine | P2 | _authenticated/telemedicine.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0403 | templates | templates | P2 | _authenticated/templates.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0404 | theme-marketplace | theme-marketplace | P2 | _authenticated/theme-marketplace.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0405 | themes | themes | P2 | _authenticated/themes.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0406 | tools / analytics | tools | P2 | _authenticated/tools.analytics.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0407 | tools / runtime | tools | P2 | _authenticated/tools.runtime.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0408 | tools / settings | tools | P2 | _authenticated/tools.settings.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0409 | tools | tools | P2 | _authenticated/tools.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0410 | transport | transport | P2 | _authenticated/transport.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0411 | unified-os | unified-os | P2 | _authenticated/unified-os.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0412 | universal | universal | P2 | _authenticated/universal.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0413 | utilities | utilities | P2 | _authenticated/utilities.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0414 | vendors | vendors | P2 | _authenticated/vendors.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0415 | vision | vision | P2 | _authenticated/vision.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0416 | wallet | wallet | P2 | _authenticated/wallet.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0417 | wallpaper-marketplace | wallpaper-marketplace | P2 | _authenticated/wallpaper-marketplace.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0418 | warehouse | warehouse | P2 | _authenticated/warehouse.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0419 | websites | websites | P2 | _authenticated/websites.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0420 | wellness | wellness | P2 | _authenticated/wellness.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0421 | white-label | white-label | P2 | _authenticated/white-label.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0422 | widgets | widgets | P2 | _authenticated/widgets.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0423 | workflows / analytics | workflows | P2 | _authenticated/workflows.analytics.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0424 | workflows / designer | workflows | P2 | _authenticated/workflows.designer.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0425 | workflows / executions | workflows | P2 | _authenticated/workflows.executions.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0426 | workflows / history | workflows | P2 | _authenticated/workflows.history.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0427 | workflows / monitor | workflows | P2 | _authenticated/workflows.monitor.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0428 | workflows / runtime | workflows | P2 | _authenticated/workflows.runtime.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0429 | workflows | workflows | P2 | _authenticated/workflows.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0430 | workforce | workforce | P2 | _authenticated/workforce.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0431 | workspace | workspace | P2 | _authenticated/workspace.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0432 | workspaces | workspaces | P2 | _authenticated/workspaces.tsx | auth-gate | ✅ | Live | shared | per-tier | included |
| F0433 | zen | zen | P2 | _authenticated/zen.tsx | auth-gate | ✅ | Live | shared | per-tier | included |