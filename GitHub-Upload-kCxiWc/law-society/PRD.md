# Law Society ATC Penang — Product Requirements Document / Law Society ATC Penang 网站产品需求文档

Updated: 5 October 2026, Malaysia time. For the current committee, Media team, maintainers and incoming committee. This document records the agreed product scope, operating rules and handover requirements. See CHECKLIST.md in the same folder for item-by-item progress. English and Chinese are paired below.

更新日期：2026 年 10 月 5 日，马来西亚时间。供现届委员会、Media 团队、维护人员及下一届委员会共同使用。本文件记录已确认的产品范围、使用规则和交接要求；逐项完成情况见同目录 CHECKLIST.md。 下文按段落提供英文与中文对照。

The delivered version runs locally and supports real content editing and saving. Administrator username/password authentication is implemented. Student Google sign-in, access from multiple computers and long-term online hosting remain unfinished. Passing local checks does not mean the website is ready for public operation.

目前交付的是保存在本机、可实际编辑和保存内容的版本。管理员账号密码已实现；学生 Google 登录、多人从不同电脑访问及长期在线托管尚未完成。不能把本地功能通过验收等同于已经可以公开运营。

## Product goals / 产品目标

The website introduces Law Society ATC Penang, lists events, provides competition downloads and supports discussion of biweekly legal topics. Committee members should maintain everyday content through clear forms without changing code. Content must survive committee transitions, and administrator credentials must be transferable.

网站让访客了解 Law Society ATC Penang、查询活动、下载比赛资料，并围绕双周法律议题发表和交流观点。委员会应通过清楚的表单维护日常内容，不需要修改程序代码。内容应跨届保留，管理员凭证可以交接。

The design uses the society’s actual logo, initially with deep navy-purple, gold and warm white. The Media team can later change primary colours, text, images and the logo; major layout redesigns still require development support. Public interfaces and introductory content remain English-only. This bilingual PRD does not introduce a Chinese website interface.

设计以学会真实 logo 为基础，初始采用深紫蓝、金黄和暖白。未来 Media 团队可以调整主要颜色、文字、图片及 logo；较大的布局重设计仍需要开发支持。所有公开界面和介绍使用英文，目前不制作中文版。 本 PRD 的双语化不改变网站界面语言。

## Confirmed information and sources / 已确认资料与来源

- Society: Law Society ATC Penang.
- Term: 2026/2027.
- Email: lawsocietyatcpg@gmail.com.
- Instagram: https://www.instagram.com/lawsocietyatcpg_/.
- Committee, purposes and proposed annual events: the supplied Law Sociey ATC Penang Proposal.pdf.
- Legal content and discussion schedule: the supplied Legal Knowledge Biweekly Plan 2026/2027 spreadsheet.
- Interactive 3D reference: https://src-atcpg.vercel.app/#about.
- Later explicit decisions in the conversation override earlier suggestions in the proposal.

- 社团名称：Law Society ATC Penang。
- 任期：2026/2027。
- Email：lawsocietyatcpg@gmail.com。
- Instagram：https://www.instagram.com/lawsocietyatcpg_/。
- 委员、宗旨和年度拟议活动：用户提供的 Law Sociey ATC Penang Proposal.pdf。
- 法律内容及讨论排期：用户提供的 Legal Knowledge Biweekly Plan 2026/2027 表格。
- 3D 交互参考：https://src-atcpg.vercel.app/#about。
- 后续聊天中的明确决定优先于 proposal 中较早的建议。

Do not invent event photographs, results, winners, actual moot problems, confirmed dates, Google Meet links or student posts. Clearly mark missing information as to be announced.

不虚构活动照片、比赛结果、获奖者、实际 moot 题目、已确认日期、Google Meet 链接或学生发言。资料未提供时明确标为待公布。

## Homepage and navigation / 首页与导航

The homepage has four main sections in this order: Hero; About Us with Composition; Events; Contact Us. Discussion and individual event pages have their own entrances, keeping the homepage free of excessive standalone sections.

首页仅保留四个主要区块，顺序固定为 Hero、About Us 与 Composition、Events、Contact Us。讨论区和活动子页通过入口进入，避免首页挤满独立栏目。

| Section | Content and behaviour | Editable in Admin |
| --- | --- | --- |
| Hero | Society identity, main copy, 3D logo and two entrances for legal topics and upcoming events | Name, campus, term, heading, introduction, button labels, featured topic/event, logo and primary colours |
| About Us | Purposes, introduction and society activities | Heading, introduction and purpose statements |
| Composition | Within About; positions and names only | Add, edit or remove committee members; update term |
| Events | Upcoming and ongoing / Past events in the same section | Status, order, dates, information, photos and PDFs |
| Contact Us | Email first, then Instagram | Heading, address, links and account display text |
| Footer | Copyright line, term, discreet Admin entrance and fixed creator credit | Society name and term follow settings; no Admin control for creator credit |

| 区块 | 内容与行为 | 后台可维护内容 |
| --- | --- | --- |
| Hero | 社团身份、主要文案、3D logo、法律议题与近期活动两个入口 | 名称、校区、任期、标题、简介、按钮文字、精选议题和活动、logo、主要配色 |
| About Us | 宗旨、介绍和学会活动方向 | 标题、介绍、各项宗旨文字 |
| Composition | 与 About 同区块，只显示职位和姓名 | 新增、修改、移除委员，更新任期 |
| Events | 同一处切换 Upcoming and ongoing 与 Past events | 活动状态、排列顺序、日期、资料、照片、PDF |
| Contact Us | Email 优先，其次 Instagram | 标题、地址、链接与账号显示文字 |
| Footer | 学会版权行、任期、低调 Admin 入口、固定创建者署名 | 学会名称和任期随设置更新；创建者署名不提供后台编辑 |

The fixed creator credit is Ooi Pin Qi, Vice President 2026/2027, in small text below the copyright line. Admin must not offer a field to overwrite, remove or rewrite it. People with source-code or server access can still modify the program. The credit is not a guarantee of technical or legal immutability and does not automatically establish ownership of every work.

创建者署名固定为 Ooi Pin Qi，Vice President 2026/2027，显示在版权行下方的小字位置。后台不得提供覆盖、删除或改写署名的字段。持有源代码或服务器权限的人仍然能够修改程序；署名不代表技术上或法律上绝对不可更改，也不自动确定全部作品的版权归属。

## Interactive 3D logo / 可交互的三维 logo

The interaction should match the SRC reference: bevelled edges, visible thickness, lighting, drag-to-rotate, release inertia and gentle automatic rotation. A CSS tilt applied to a flat image is insufficient.

需要匹配 SRC 参考中的操作方式：立体切边、可见厚度、光影、拖动旋转、松手惯性、轻微自动旋转。不是单张图片的 CSS 倾斜效果。

The local implementation uses a thick square tile in Three.js. Both faces retain the complete original image and pink background; rear text is not mirrored. It follows the SRC-style drag and inertial rotation. Support pause, reset and arrow-key controls; respect reduced-motion preferences. Show a static fallback when 3D is unavailable. Replacement logos may be square PNG or JPEG files; transparency is not required.

本地实现使用 Three.js 的有厚度方形牌，正反面保留完整原图和粉色背景，背面文字不镜像。沿用 SRC 参考的拖动、惯性旋转交互。支持暂停旋转、重置视角和键盘方向键；尊重减少动画的系统偏好。不能使用 3D 时显示静态回退。更换 logo 时可上传方形 PNG 或 JPEG，不再要求透明底。

## Event information and statuses / 活动信息与状态

The ongoing Biweekly Legal Knowledge and Discussion event initially appears first in Events and opens the legal discussion area. Administrators can maintain the order afterwards.

持续进行的 Biweekly Legal Knowledge and Discussion 位于 Events 初始列表最上方，进入法律讨论专区。列表顺序之后由管理员维护。

| Status | Visitor experience | Use |
| --- | --- | --- |
| Planned | Grey, non-clickable text with a pending-information notice | Still being planned; dates and details unconfirmed |
| Upcoming | Clickable details and any available registration link | Announced but not started |
| Ongoing | Clickable and labelled as ongoing | Biweekly content or an activity in progress |
| Past | Listed under past events, with accessible recap and photos | Archived after completion |

| 状态 | 访客看到的效果 | 使用场景 |
| --- | --- | --- |
| Planned | 灰色文字，不可点击，显示待公布提示 | 活动仍在筹备，日期和细节未确认 |
| Upcoming | 可点击查看活动详情和已有报名入口 | 活动已公布，尚未开始 |
| Ongoing | 可点击并标示持续进行 | 双周内容、正在进行的活动 |
| Past | 出现在往期活动，可打开回顾与照片 | 活动结束后归档 |

Administrators explicitly select the status. A change in the computer’s date must not automatically imply that a proposed event took place. Keep estimated months where dates are unconfirmed. Display registration only when a valid link has been supplied.

管理员应明确选择状态，不因电脑日期改变而自动把拟议活动当成已举办。未确认日期保留估计月份。登记链接只有填入有效地址后才显示。

Each event keeps the same detail page throughout its life: introduction and registration before the event; problem papers, rules and other PDFs, a recap and a gallery afterwards. Uploading photos, editing descriptions or changing status must not delete the original event record.

每项活动沿用同一个详情页：举办前介绍活动和报名，之后保留题目、规则等 PDF，并加入活动回顾和相册。上传照片、更新描述或更改状态不应删除原来的活动记录。

Event fields include title, category, date or period, introduction or recap, status, registration link, photos, captions and downloadable PDFs. The first photo is the main image; administrators can set the cover or remove photos, and visitors can enlarge them. Administrators name PDFs, such as Moot Problem 2026 or Competition Rules. The current limit is 5 MB per file. Images accept PNG, JPEG and WebP; documents accept PDF.

活动资料包括标题、类别、日期或时间段、介绍或回顾、状态、报名链接、照片、照片说明及可下载 PDF。照片列表第一张是主要照片；可设封面、移除照片、点击放大浏览。PDF 由管理员自行命名，例如 Moot Problem 2026、Competition Rules。文件上限目前为每个 5 MB；图片接受 PNG、JPEG、WebP，资料文件接受 PDF。

### Rules for retaining the temporary Moot preview / Moot 临时示范的保留规则

The user requested a preview of the page with materials and explicitly said not to restore the grey state until they approve closing it. Retain the separate Moot layout preview; its entrance is an exception to the Planned-event rule.

用户要求先看有资料后的样子，并明确要求在说 OK 关闭之前不要恢复成灰色状态。因此当前保留独立的 Moot layout preview，Planned 活动的预览入口为例外。

- Clearly label the page as a layout preview, not confirmation that the competition is announced or completed.
- Show an introduction, downloads and responsive photo placeholders: three equal columns on desktop; one large and two smaller positions on mobile.
- Do not invent the actual moot problem, which has not been supplied.
- The sample download uses the supplied society proposal and must explicitly say it is not the moot question.
- Without real event photos, show labelled placeholders rather than fabricated photographs.
- Keep the preview enabled until the user explicitly asks to close it.
- Admin → Events provides a preview switch. Disabling it makes a still-Planned Moot event grey and non-clickable; published events continue to follow their own status.

- 示范页必须持续清楚标注为排版预览，不表示比赛已经确认或举办。
- 展示活动介绍、资料下载区和响应式照片位置：桌面三列等宽，手机一大两小。
- 真实 moot 题目未提供，不得伪造题目。
- 下载示范使用已提供的学会 proposal，必须明确说明这不是 moot question。
- 无真实活动照片时仅显示标注的照片位置，不使用假活动照。
- 保持开启，直到用户明确要求关闭。
- Admin 的 Events 页面提供预览开关。关闭后，仍处于 Planned 的 Moot 活动恢复灰色且不可点击；已正式发布的活动仍按自己的状态显示。

## Legal topics and discussion / 法律议题与讨论

Each topic is a dedicated discussion hub, similar to a supertopic. Only administrators can create topics. Visitors read official society content first, then student posts and discussion outcomes.

每个议题相当于一个独立超话，只有管理员能创建。访客先看学会官方内容，再浏览同学帖子和讨论结果。

### Biweekly workflow / 双周工作流程

Research prepares the content, obtains internal confirmation and hands it to PRM for the Instagram post. Written interaction and a Google Meet discussion follow while research for the next topic begins. The cadence is: week 1 research; week 2 publication; week 3 discussion plus research for the next topic; week 4 publication; week 5 discussion. Not every internal submission deadline needs to appear publicly.

Research 研究与准备内容，经过内部确认后交给 PRM 制作及发布 IG 内容，之后安排文字互动及 Google Meet 讨论，同时开展下一期研究。不是要求网站公开内部所有交稿期限。 节奏为第 1 周研究、第 2 周发布、第 3 周讨论并开始下一期研究、第 4 周发布、第 5 周讨论。

The spreadsheet currently contains 11 content rounds and their discussions. The first topic is Najib’s House Arrest, scheduled for publication on 9 October 2026 and discussion on 16 October; the time is to be confirmed. The Christmas/New Year break runs from 12 December 2026 to 7 January 2027; the examination break runs from February to May 2027. Do not automatically create empty hubs for rounds without confirmed topics.

表格目前有 11 期内容及对应讨论。首期题目为 Najib’s House Arrest，计划 2026 年 10 月 9 日发布、10 月 16 日讨论，具体时刻待定。2026 年 12 月 12 日至 2027 年 1 月 7 日为圣诞与新年暂停期；2027 年 2 月至 5 月为考试暂停期。其他尚未定题的期次不自动生成空白超话。

The proposal mentions two Instagram posts: a legal explainer and selected student views. The schedule does not separately specify publication dates for the selected-views posts; the committee must decide and publish them. Do not claim automatic Google Sheets or Instagram synchronisation.

Proposal 提到法律解说与学生观点精选两篇 IG 内容；目前计划表未单独列出精选观点帖发布日期。委员会需要自行确定并发布。网站不能声称已经自动同步 Google Sheets 或 Instagram。

### Topic page / 议题页面

- Title, introduction, official explainer and sources.
- Related Instagram post link.
- Explainer publication date, discussion date, Malaysia time and Google Meet entrance.
- Three statuses: Upcoming, Open and Archived.
- Upcoming is readable without new posting; Open allows new posts and comments; Archived preserves records but stops new posts, comments and reposts.
- Display a pending notice when actual content or external links are missing; no fake links.
- Administrators can pin useful perspectives; agreement with the society is not required.

- 标题、简介、官方解说与资料来源。
- 对应 IG 帖子链接。
- 解说发布日期、讨论日期、马来西亚时间及 Google Meet 入口。
- Upcoming、Open、Archived 三种状态。
- Upcoming 允许阅读，未开放发帖；Open 开放新帖子和评论；Archived 保留记录，停止新帖子、评论及转发。
- 实际内容和外部链接未提供时显示待公布说明，不显示假链接。
- 管理员可置顶值得参考的观点，不要求观点必须赞同学会。

### Student interaction / 同学互动

Anyone can browse. Signed-in users can post, comment, Like, Dislike, Report and Repost within administrator-created topics. Show nicknames publicly, not email addresses. Anonymous posting is not offered.

所有访客能浏览。登录后可以在管理员创建的话题下发帖、评论、Like、Dislike、Report、Repost。公开显示昵称，不公开 Email。不提供匿名发帖。

A user may keep either a Like or a Dislike on a post, not both; selecting the same reaction again removes it. Repost is an internal reshare retaining the original author and source post. Version one places it in the same topic’s timeline, without personal profile pages or a cross-topic following feed. Users can undo their own repost. Removing an original post also handles its related reposts and interactions.

同一人对同一帖子只保留 Like 或 Dislike 之一，再次点击同一反应可取消。Repost 是站内转发，保留原作者与原帖来源；第一版把它放回相应话题的时间流，不建设个人主页或跨话题关注流。再次点击可以取消自己的转发。管理员删除原帖时同时处理关联转发和互动。

Reports enter an administrator review queue and do not automatically remove content. Administrators can review or dismiss reports, remove posts or comments, and pin or unpin posts. Discussions represent student views, not legal advice.

举报只进入管理员审核，不自动删除。管理员可查看、驳回举报、移除帖子或评论、置顶或取消置顶。讨论内容作为学生观点保留，不当作法律意见。

Student sign-in is currently a labelled local demonstration: each fresh login creates a new demo identity. Production Google sign-in, stable personal accounts and production anti-abuse configuration remain pre-launch work.

当前学生登录仍是标明的本地演示身份，每次新登录会创建新的演示用户。正式 Google 登录、稳定个人账号及生产反滥用配置属于上线前未完成项。

## Administrator interface for nontechnical users / 非技术管理员后台

Enter through Admin in the footer. On the first local setup, create a username and password; the initial account-creation entrance then closes. Subsequent access requires valid credentials. Selecting an admin identity must not bypass authentication.

管理员通过页脚 Admin 进入。首次在本机设置用户名与密码；设置完成后关闭首次创建入口。以后必须用正确用户名和密码进入，不再允许选择 admin 身份绕过密码。

Admin sections are Home and branding, About and committee, Events, Legal topics, Contact, Moderation, and Account and backups. Use forms, selectors, add/delete buttons, file uploads and Save buttons. Administrators must not need to edit JSON or code.

后台分为 Home and branding、About and committee、Events、Legal topics、Contact、Moderation、Account and backups。操作以表单、选择框、增删按钮、文件上传和保存按钮完成，不要求用户编辑 JSON 或代码。

Text changes take effect after Save; image and PDF uploads save immediately. Explain this distinction in the interface. Show the reason for a failed save and retain input where possible. Warn before leaving unsaved edits. Confirm deletions and allow recovery through content history.

文字点击 Save 后生效；图片与 PDF 上传即时保存，界面必须说明区别。保存失败显示原因并尽量保留原输入。离开未保存的编辑内容应有提醒。删除操作要确认，且可通过历史版本找回。

### Administrator account and handover / 管理员账号与交接

- Usernames: 3–50 letters, digits, dots, hyphens or underscores.
- Passwords: 12–128 characters; the server stores only a salt and hash.
- Changing the username or password requires the current password.
- Password changes revoke existing sessions; the old password stops working.
- Content is not tied to a committee term. Changing credentials does not clear website information.
- The society account can pass to the next committee. A shared account cannot reliably identify the individual editor; the committee must manage its own usage records.
- Sessions last 12 hours; repeated failed logins trigger a cooldown.
- Enter real passwords in the interface, never in chat.
- Email password recovery is not configured. Define a recovery procedure before launch.

- 用户名允许 3 至 50 位字母、数字、点、连字符或下划线。
- 密码 12 至 128 个字符，服务端只保存盐与哈希。
- 修改用户名或密码需要验证当前密码。
- 改密后撤销已有会话，旧密码不再有效。
- 内容不绑定到任期，改账号不清除网站资料。
- 同一社团账号可以交接给下一届；共享账号无法准确区分具体是谁编辑，委员会需自行管理使用记录。
- 会话有效期 12 小时；连续失败登录有冷却限制。
- 用户自行在界面输入真实密码，不在聊天中提交密码。
- 没有配置邮件找回密码。上线前需要明确忘记密码的恢复办法。

## Storage, backup and recovery / 保存备份与恢复

Text, discussions and administrator information currently reside in local SQLite storage. Photos and PDFs reside in the project’s uploads directory. Restarting the service must not reset content or the administrator password.

当前文字、讨论及管理员资料保存在本机 SQLite，照片和 PDF 保存在项目上传目录。重启服务不得重置内容或管理员密码。

Save the previous content version before every administrator content change. Retain the latest 50 versions and display the latest 20. Restoration rolls all content, including discussions, back to that version; save the current content before restoring so the action can be reversed. Removing an image from a page does not immediately erase its file, allowing historical versions to reference it.

每次管理员修改内容前保存旧版本，保留最近 50 个，界面展示最近 20 个。恢复会把全部内容回到该版本，包括讨论；恢复前也保存当前内容，以便反悔。图片文件不因页面移除而立即从磁盘抹去，历史版本仍可引用。

The downloadable ZIP contains content and referenced uploaded files, not administrator passwords, sessions or application source code. Import preserves the current administrator account and validates paths, data structure and references, rejecting out-of-bounds paths and conflicting files. Moving to another computer also requires the application and runtime; the content ZIP alone is insufficient.

下载的 ZIP 包含内容及被引用的上传文件，不包括管理员密码、会话和程序代码。恢复导入时保留当前管理员账号；检查文件路径、数据结构和引用关系，拒绝越界文件路径及冲突文件。跨电脑交接时还需要应用程序文件和运行环境，不能只交一个内容 ZIP。

## Display quality and accessibility / 显示质量与可访问性

- Usable on desktop and mobile, without horizontal overflow of text or buttons.
- Committee members use text only, without empty avatar slots.
- Clear typographic hierarchy; grey Planned events remain readable.
- Label every input and use clear button names.
- Support keyboard navigation, forms, modal dismissal and 3D controls.
- Allow pausing 3D; disable automatic rotation under reduced-motion preferences.
- Provide close controls for modals and galleries; allow long forms to scroll.
- Use safe settings for external links opened in new windows.
- Render public submissions as text; do not execute posted HTML.
- Clearly explain empty lists, missing photos/PDFs, no reports and failed saves.

- 桌面和手机都能使用，不出现正文或按钮横向溢出。
- 委员只显示文字，不保留头像空位。
- 文字层级清楚，灰色 Planned 活动仍可读。
- 每个输入框有标签；按钮名称清楚。
- 键盘能打开入口、填写表单、关闭弹窗和操作 3D。
- 3D 可以暂停，减少动画偏好下不自动旋转。
- 弹窗和图册有关闭入口；长表单可以滚动。
- 外部链接使用安全的新窗口设置。
- 公开内容按文字输出，发帖中的 HTML 不执行。
- 空列表、无照片、未提供 PDF、无举报及保存失败都要有清楚状态。

## Local version versus public launch / 本地与正式上线的界线

Added on 5 October 2026: ordinary administrator saves must update the database-backed public content without a GitHub/Vercel deployment for every edit. The local version already works this way; the online backend, persistent database and media storage are not configured. The homepage Biweekly area directly displays the selected topic’s Google Meet link, or a pending notice when no link is supplied.

2026 年 10 月 5 日补充：日常管理员保存内容后，公开页面读取数据库新版本，不能要求管理员每次到 GitHub／Vercel 重新部署。当前本地版已采用这个方式；正式在线后台、持久资料库与媒体存储尚未配置。首页 Biweekly 直接显示所选议题的 Google Meet 链接，未填写则显示待发布提示。

This version is local only; public deployment has not been authorised. It binds only to 127.0.0.1, which other computers cannot use to access this machine. Real administrator authentication does not make the local development server suitable for direct exposure to the internet.

本轮只在本机运行，未授权公开发布。只绑定 127.0.0.1，其他电脑无法靠这个地址访问。管理员真实登录不意味着这个本地开发服务器适合直接暴露到互联网。

Public launch additionally requires a domain and hosting, HTTPS, durable database and media storage, a backup plan, student Google sign-in, password recovery, privacy and community rules, and performance/security testing. The website can continue across committee terms, but there is no promise of permanent maintenance-free operation, zero cost or zero data loss.

正式上线需要另外落实域名与托管、HTTPS、长期数据库和媒体储存、备份计划、学生 Google 登录、密码恢复、隐私及社区规则、性能和安全测试。网站可以延续使用，但不能承诺永久无需维护、零费用或绝不丢失数据。

## Acceptance and handover / 验收与交付

Update progress using actual evidence in CHECKLIST.md. Separate technical verification from user approval: passing tests does not mean Media has approved the colours, and an available layout preview does not mean the user has authorised closing it.

以 CHECKLIST.md 中的实际证据更新进度。技术验证与用户认可分开：测试通过不代表 Media 已认可配色，排版示范开放不代表用户已经批准关闭。

Deliverables include website source files, a local launcher, the administrator interface, this PRD, a checkable acceptance checklist and existing operating instructions. Further visual changes should continue in the same project while preserving existing content.

交付包含网站源文件、本地启动入口、管理员后台、这份 PRD、可勾选验收清单和现有运行说明。下一步视觉调整继续在同一项目完成，保持既有内容。

## Design history — 4 October 2026: lighter editorial layout / 设计历史 — 2026 年 10 月 4 日：轻量编辑式排版版本

The user wanted less AI-template styling and visual bulk while keeping the overall direction. This iteration changed presentation only: no backend rebuild, no overwriting administrator content and no closing the Moot preview. This section records earlier iterations, not instructions to reinstate superseded designs.

用户希望减少 AI 模板感与厚重感，保留整体方向。本次只改变呈现，不重建后台、不覆盖管理员内容，也不关闭 Moot 预览。 本节记录历史迭代，不代表应恢复已经被替代的设计。

Reference comparison recorded when the official websites were reviewed:

参考比较（当日查看官网）：

| Reference | Useful qualities | Choice for this website |
| --- | --- | --- |
| [Yale Law School](https://law.yale.edu/) | Serif headings and clear hierarchy | Main visual reference; no copied image-led homepage or fabricated event photos |
| [Oxford Law Society](https://oxfordlawsoc.com/) | Clear student-society identity and event entrances | Keep the society voice and two entrances, without complex navigation or membership purchasing |
| [Oxford Law Faculty](https://www.law.ox.ac.uk/) | Actual content, events and photography at the centre | Present events as a programme, without extra layers of cards and navigation |

| 参考 | 可借鉴之处 | 本站取舍 |
| --- | --- | --- |
| [Yale Law School](https://law.yale.edu/) | 衬线标题与清楚的文字层级 | 主要视觉参考；不照搬大图首页，没有真实活动照片时不放假照片 |
| [Oxford Law Society](https://oxfordlawsoc.com/) | 明确的学生社团身份及活动入口 | 保留社团语气与双入口，不引入它的复杂栏目或会员购买流程 |
| [Oxford Law Faculty](https://www.law.ox.ac.uk/) | 把实际内容、活动和照片放在中心 | 活动以节目单方式呈现，不增加多层卡片和导航 |

Historical changes: removed the gradient rounded panel behind the 3D logo; reduced heading sizes; increased paragraph/section spacing; used lightweight arrow links for the two entrances; presented purposes as rows; separated event dates, names and statuses; removed the solid dark contact/footer background; reduced decorative borders on discussion and PDF pages. The purple/gold identity, four-section structure, editing tools and fixed credit remained. The arrows were subsequently removed.

具体调整：取消 3D logo 的渐变圆角底板；降低标题尺寸；扩大段落与区块间距；双入口改为带箭头的轻量文字链接；About 目的改为横向条目；活动日期、名称和状态分层；联系及页脚取消整片深色背景；讨论与 PDF 子页同步减少装饰边框。紫金品牌、原有四段结构、后台编辑能力和固定署名保持。 箭头在后续迭代中已移除。

Visual styles are separated into dist/editorial.css to support later Media adjustments. Final visual approval remains with the user and Media team.

视觉样式独立放在 `dist/editorial.css`，便于后续 Media 调整。最终视觉认可仍由用户与 Media 决定。

### Second iteration that day: less rigid composition — superseded / 同日第二轮：减少一板一眼的感觉（已被第三轮替代）

Kept the first iteration’s whitespace but made the homepage entrances unequal in size and position. Biweekly used a pale-pink paper-like panel, while Moot sat slightly lower. A low-contrast section sign (§), not a replacement logo, appeared behind the 3D object. About used staggered paragraphs; desktop Events paired a left introduction with a right programme, returning to one column on mobile. Contact used a larger italic heading. Functions and existing content were unchanged.

第一轮留白保留，进一步使用不等宽、不等高的首页双入口。Biweekly 为淡粉纸面主版，Moot 为稍向下错位的次入口；3D 后方加入低对比度的法律分节符号 §，不是新的 logo。About 的三个目的采用错落的小段落；桌面 Events 为左侧介绍、右侧节目单，手机回到单列。Contact 使用较大斜体标题，与正文形成变化。功能和原有资料不变。

Additional references were [The Gentlewoman](https://thegentlewoman.co.uk/) for editorial presentation and whitespace around objects, and [A24](https://a24films.com/) for typographic contrast. Only visual rhythm was borrowed, not photography, brand assets, pop-ups or video. This direction replaced the first iteration at the time and was itself superseded by the third.

追加参考：[The Gentlewoman](https://thegentlewoman.co.uk/) 的杂志式呈现与物件周围留白；[A24](https://a24films.com/) 的强弱文字对比。只借鉴视觉节奏，不使用它们的照片、品牌资产、弹窗或视频。此方向当时替代第一轮全站均匀行列的设计，之后已被第三轮替代。

### Third iteration that day: clear, restrained and finite / 同日第三轮：清晰、克制、可看见终点

After feedback that the second iteration felt cluttered, long and lacking breathing room, removed the §, tilts, pink emphasis panel, offset entrances and staggered paragraphs. Hero entrances became aligned and arrow-free. Committee names remained a plain list. Events returned to full width with a very light background boundary. All four sections and content remained; events were not hidden to shorten the page.

依据用户对第二轮「乱、太长、没有呼吸感」的反馈，移除 § 装饰、倾斜、淡粉重点卡片、错位入口和阶梯式段落。Hero 双入口对齐、无箭头；委员会保持纯姓名列表；活动恢复全宽并以非常浅的底色界定范围；保留四段结构和所有资料，不靠隐藏活动缩短页面。

Further references were [RSA Events](https://www.thersa.org/events/) and [Cambridge University Society of Women](https://cusocietyofwomen.com/), for clear grouping and a concise homepage, without copying colours or assets. Earlier overlapping styles were cleaned up and type/spacing unified. Historical measurements at that iteration were approximately 2,907 px page height at 1,280 px desktop width and 4,196 px at 390 px mobile width; these are not current acceptance targets and change with content. Further decoration requires user approval.

补充查看 [RSA 活动页](https://www.thersa.org/events/) 和 [Cambridge University Society of Women](https://cusocietyofwomen.com/)，采用清楚内容分组与简短首页的思路，不复制配色或素材。清理前两版叠加样式，统一字号和间距。该轮历史测量为：桌面 1280px 时整页约 2907px，390px 手机约 4196px；这些不是现行验收目标，页面高度会随后台内容变化。后续以用户认可为准，不再自行追加装饰。

### Current additions: complete logo, distinct sections and light/dark modes / 当前补充：完整 logo、明确分区、明暗模式

Keep the square 3D logo with its pink background. Distinguish Hero, About, Events and Contact through backgrounds and boundaries, without adding nested entrances. Show main content, names and event lists directly; reserve detail pages for individual topics, event materials and PDFs. Shorten starter headings, introductions and preview notices. Migrate only untouched starter copy and save a pre-migration version.

保留粉色底的方形 3D logo。Hero、About、Events、Contact 使用不同背景及边界，不增加嵌套内容入口。主要内容、名单与活动列表直接展示；详情只用于独立议题、活动资料和 PDF。默认标题、简介和示范说明缩短；仅迁移未被管理员修改的原始文案，并保存迁移前版本。

The top-right Light / Dark control supports keyboard access and accessible naming. Initially follow the device preference; save manual choices in the current browser across navigation and refreshes. Dark mode uses a fixed readable palette; light mode continues to use administrator-selected brand colours. Apply the modes to the homepage, event pages, discussions, forms and Admin. Administrator steps are in the Chinese README.md.

右上角 Light / Dark 控件支持键盘和无障碍名称。首次跟随设备配色，手动选择后保存在当前浏览器，切页和刷新保留。深色模式使用固定的可读配色，浅色模式继续使用管理员品牌色。主页、活动子页、讨论、表单和后台均适配。管理员操作步骤见 README.md 中文说明。
