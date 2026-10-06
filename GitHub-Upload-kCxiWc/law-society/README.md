# Law Society ATC Penang — website

This README describes the original local preview. The production-ready site is built with `npm run build` and uses the society's Vercel and Supabase accounts; read [HANDOVER.md](HANDOVER.md) before publishing or handing it to the next committee. Running the Python preview does not test live Google sign-in, Google Sheet sync or shared online editing.

Run `python3 server.py` from this directory, then visit http://127.0.0.1:4173.

On this Mac, you can also double-click `Start Website.command` and keep its terminal window open. If the site is already running, use the existing browser preview instead of starting a second copy. Python 3 is required on a new computer.

Product scope is in `PRD.md`. The detailed acceptance checklist is in `CHECKLIST.md`. For society ownership, live connections, everyday admin use and next-committee transfer, read [HANDOVER.md](HANDOVER.md). Production items are not complete until the final-domain checks in that file pass.

No package installation is required. Python 3.9+ provides the local HTTP server and SQLite storage. The interface uses plain HTML, CSS and JavaScript. Fonts use Google Fonts when available, with local fallbacks.

## Included

- Responsive English homepage: Hero, About + committee, Events, Contact.
- Proposal-grounded names and planned activities. No fabricated event photography or student comments.
- Topic pages, student posts, comments, mutually exclusive like/dislike, in-site reposts with attribution, reports and pinned posts.
- Admin editing for events, topics, society information and committee; photo uploads and moderation.
- Persistent local SQLite data in `data/law-society.sqlite3`; uploaded images in `dist/uploads`.

## Administrator access and handover

Open Admin in the footer. On the first visit, choose a username and password (12–128 characters). Setup is one-time; subsequent access requires those credentials. No default administrator password is shipped or stored in the source. Passwords use a random salt and PBKDF2-HMAC-SHA256 (600,000 iterations). Session tokens are hashed in SQLite, expire after 12 hours, and survive server restarts. Eight failed administrator attempts trigger a 15-minute cooldown.

Use Account & backups to change credentials before handing over to the next committee. Changing credentials revokes all existing sessions. Keep credentials in the society’s password manager; email password recovery is not configured.

Google OAuth for students is still not configured. The student Sign in dialog remains an explicitly labelled temporary demo identity. Students cannot promote themselves to administrator.

The server binds only to 127.0.0.1 and checks Host and Origin. Do not expose it publicly or port-forward it. Public launch still requires production hosting, HTTPS/Secure cookies, verified student identity, broader anti-abuse controls and scheduled off-device backups. Local storage cannot provide multi-computer access by itself.

## No-code content management

Admin sections cover Hero text and buttons, featured topics/events, logo upload and 3D mode, main brand colours, section copy, committee rows and academic term, events and ordering, gallery images, PDF documents, legal topics, contact information, post moderation and handover. Photos/PDFs save immediately; text forms have a Save changes button. The creator attribution is deliberately absent from admin settings and fixed in `dist/cms.js`; repository/server owners can still change source code. This is attribution, not a technical or legal guarantee of immutability.

Before each administrator content mutation, a revision is stored in SQLite. The last 50 are kept, and the latest 20 can be restored from Admin. A restore replaces all content with that snapshot, including discussion state. Downloadable ZIP backups include content and referenced uploads, not passwords or sessions. Import validates paths, record shape and references; rejects conflicting uploaded filenames; and leaves administrator credentials unchanged. Keep the application source with backups for migration to another computer.

The 3D emblem uses a local Three.js build (license in `dist/vendor`) and a square tile with thickness, drag inertia, keyboard controls, reset and pause. The original PNG is retained unchanged, including its pink background. Both faces show the artwork without mirrored lettering. Square PNG or JPEG replacements are supported.

Light / Dark can be switched from the header. It follows the device preference until explicitly chosen, then remembers the choice in that browser. Dark mode uses a fixed readable palette; administrator brand colours apply to light mode.

## 管理员操作（无需写代码）

1. 打开 http://127.0.0.1:4173/#/admin ，或点页尾 Admin。右上角 Sign in 是学生入口，不是后台。
2. 首次点 Set up administrator account，自己设置用户名和至少 12 字符密码。之后使用 Administrator sign in 登录。
3. Home & branding 改首页、logo、浅色品牌色；About & committee 改简介、任期及名单。
4. Events 用 Add event 新增，用 Edit 修改或上传照片／PDF，用 Delete 删除。新活动先保存，再上传文件。
5. Legal topics 新增讨论议题；Contact 改邮箱和 Instagram；Moderation 处理帖子和举报。
6. 文字改完按 Save changes／Save event／Save topic，上传照片及 PDF 则立即保存。点 View website 检查访客看到的内容。
7. 交接前到 Account & backups 下载备份，并更换管理员密码。网站仍只在本机运行，未上线。

活动状态：planned 是灰色不可点（Moot 布局预览除外）；upcoming 和 ongoing 可进入详情；past 进入历史活动。议题状态 open 才开放发帖。

Google Meet：Admin → Legal topics → 对应议题 Edit → Google Meet link → Save topic。首页精选 Biweekly 和该议题详情共用这个链接；未填写时首页显示 Link coming soon，不生成假链接。更换首页议题后会使用新议题的会议链接。

后台保存的是数据库内容，不是修改源代码。日常文字、名单、活动、照片、PDF 和会议链接无需 GitHub 提交或重新部署；访客重新打开／刷新页面会读取最新内容。当前数据库仅在这台电脑。正式上线仍需一次性配置在线后台、持久数据库和文件储存；只把 dist 上传到静态托管不能运行这个 CMS。未来修改网页功能或排版代码才属于重新部署。

## Requested Moot layout preview

The Events list includes the ongoing Biweekly Legal Knowledge & Discussion item. The planned Moot entry opens `#/event-preview` while the explicit preview setting is on. That page is labelled as a layout example: no real results or event photos are invented. Photo slots show the proposed layout. Its downloadable PDF is the supplied society proposal, clearly labelled as an example, not the moot question. Keep this preview enabled until the user asks to close it. Admin > Events has the switch to restore the grey, non-clickable planned entry.

The first topic is scheduled for 9 October 2026 and begins in `upcoming` state. To test posting, use Admin, edit its status to `open`, and save. The official explainer is intentionally empty until supplied by the society. Meeting and post links can be added in Admin.

Deleting a topic also removes its posts and related interactions. Uploaded source files are retained locally even if the associated event is deleted. Back up the database and uploads together.

For isolated API verification, set `LAWSOC_DB` to a temporary database path and `LAWSOC_PORT` to another port. The browser WebMCP read-only topic listing is feature-detected and optional.
