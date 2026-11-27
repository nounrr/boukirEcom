import type { AppLocale } from '@/i18n/locale'

/**
 * Privacy policy of the site and the Boukir Diamond app (Moroccan Law 09-08; App Store and Google Play require a
 * public policy and, for Google Play, a public page explaining how to delete an account: the "suppression-compte"
 * section, linked as /{locale}/confidentialite#suppression-compte).
 * Keep it true to what the apps do: any new data, service provider or permission is added here.
 */
export const PRIVACY_EFFECTIVE_DATE = '2026-11-26'
export const DELETION_ANCHOR = 'suppression-compte'

type Section = readonly [title: string, body: string, anchor?: string]

type PrivacyCopy = {
  title: string
  intro: string
  updated: string
  contents: string
  sections: readonly Section[]
}

export const privacyContent: Record<AppLocale, PrivacyCopy> = {
  fr: {
    title: 'Politique de confidentialité',
    intro: 'Cette politique explique quelles données BOUKIR DIAMOND CONSTRUCTION STORE (SARL, Tanger) collecte sur boukirdiamond.com et dans l’application Boukir Diamond, pourquoi, avec qui elles sont partagées et comment exercer vos droits, conformément à la loi marocaine n° 09-08.',
    updated: 'Mise à jour le 26 novembre 2026',
    contents: 'Sommaire',
    sections: [
      ['1. Responsable du traitement', 'BOUKIR DIAMOND CONSTRUCTION STORE, IKAMAT REDOUAN 1, AZIB HAJ KADDOUR, LOCAL 1 ET N° 2, Tanger, Maroc. Contact : boukir.diamond23@gmail.com ou +212 677 725 602 (téléphone et WhatsApp).'],
      ['2. Données que nous collectons', 'Compte : nom, prénom, téléphone, e-mail, mot de passe (enregistré chiffré), photo de profil si vous en ajoutez une, type de compte (particulier, artisan, promoteur, société et ICE). Commandes : produits, montants, adresse et point de livraison, mode de paiement, historique et solde. Demandes de service et missions des artisans : description, adresse, photos. Messages au service client et questions à l’assistant (texte, et voix si vous utilisez le micro). Appareil : identifiant de notification, langue, et rapports de plantage techniques. Nous ne collectons aucune donnée bancaire complète : le paiement par carte se fait sur la plateforme sécurisée du CMI.'],
      ['3. Autorisations de l’application', 'Position : seulement lorsque l’application est ouverte, pour placer votre adresse de livraison ou d’intervention sur la carte et, pour les chauffeurs de l’équipe qui l’activent, pour partager la position du véhicule pendant une tournée. Appareil photo et photos : rechercher un produit en photo, photo de profil, photos de demandes et de missions ; seules les photos que vous choisissez sont envoyées. Micro : questions vocales à l’assistant et recherche vocale, seulement pendant que vous parlez. Face ID / empreinte : déverrouillage rapide ; l’empreinte ou le visage ne quittent jamais votre téléphone. Notifications : suivi de commande et messages. Chaque autorisation est facultative et peut être retirée dans les réglages du téléphone.'],
      ['4. Pourquoi nous les utilisons', 'Créer et sécuriser votre compte (codes de confirmation), traiter et livrer vos commandes, vous informer de leur avancement (départ du livreur, arrivée proche), gérer les paiements, le solde et les remises, répondre à vos demandes, mettre en relation clients et artisans, améliorer et corriger l’application. Aucune donnée n’est vendue ni utilisée pour de la publicité ciblée ou du suivi entre applications.'],
      ['5. Suivi de livraison', 'Pendant une livraison, la position du véhicule (boîtier GPS du véhicule ou téléphone du chauffeur) sert à estimer l’heure d’arrivée. Pour protéger la vie privée de tous, un client ne voit le véhicule sur la carte que lorsqu’il est à moins de 3 km de son adresse ; avant, seule l’estimation d’arrivée est affichée. L’historique des trajets est effacé après 30 jours.'],
      ['6. Prestataires', 'Nous partageons uniquement ce qui est nécessaire avec : Meta (WhatsApp) et nos fournisseurs de SMS et d’e-mail pour envoyer les codes de confirmation ; le CMI pour le paiement par carte ; OpenAI pour répondre aux questions posées à l’assistant (le texte ou la voix de la question, sans votre nom ni vos coordonnées) ; Google (connexion Google si vous la choisissez, cartes) ; Sentry pour les rapports de plantage ; Expo pour l’envoi des notifications et des mises à jour de l’application ; notre fournisseur de boîtiers GPS pour les véhicules de l’entreprise. Ces prestataires peuvent traiter les données hors du Maroc, dans le cadre de leurs engagements de protection.'],
      ['7. Durée de conservation', 'Les données du compte sont conservées tant que le compte existe. Les documents comptables et commerciaux (factures, bons, paiements) sont conservés 10 ans comme la loi l’exige. Les codes de confirmation expirent en quelques minutes. Les positions des véhicules sont effacées après 30 jours.'],
      ['8. Supprimer votre compte', 'Dans l’application : Compte › Supprimer mon compte, puis confirmez (avec votre mot de passe si votre compte en a un). Sur le site : connectez-vous puis écrivez-nous depuis la page Contact. Sans accès à l’application : envoyez « Supprimer mon compte » avec votre numéro de téléphone ou e-mail par WhatsApp au +212 677 725 602 ou à boukir.diamond23@gmail.com ; nous vérifions qu’il s’agit bien de vous et supprimons le compte sous 7 jours. La suppression efface votre accès, vos coordonnées de connexion, photo, adresses, panier, favoris et appareils enregistrés. Seuls les documents comptables que la loi oblige à garder sont conservés, sans aucun accès en ligne.', DELETION_ANCHOR],
      ['9. Vos droits', 'Vous pouvez accéder à vos données, les faire corriger, vous opposer à un traitement ou demander leur suppression en nous écrivant aux coordonnées ci-dessus. Vous pouvez aussi saisir la Commission nationale de contrôle de la protection des données à caractère personnel (CNDP, www.cndp.ma).'],
      ['10. Sécurité et mineurs', 'Les échanges sont chiffrés (HTTPS), les mots de passe enregistrés sous forme chiffrée et l’accès aux données limité à l’équipe qui en a besoin. Le service s’adresse aux personnes majeures ; il n’est pas destiné aux enfants.'],
      ['11. Modifications', 'Nous mettons cette page à jour lorsque nos pratiques changent ; la date en haut de page indique la dernière version.'],
    ],
  },
  en: {
    title: 'Privacy policy',
    intro: 'This policy explains what data BOUKIR DIAMOND CONSTRUCTION STORE (SARL, Tangier) collects on boukirdiamond.com and in the Boukir Diamond app, why, who it is shared with and how to exercise your rights, under Moroccan Law 09-08.',
    updated: 'Updated on 26 November 2026',
    contents: 'Contents',
    sections: [
      ['1. Controller', 'BOUKIR DIAMOND CONSTRUCTION STORE, IKAMAT REDOUAN 1, AZIB HAJ KADDOUR, LOCAL 1 ET N° 2, Tangier, Morocco. Contact: boukir.diamond23@gmail.com or +212 6 50 02 22 42 (phone and WhatsApp).'],
      ['2. Data we collect', 'Account: first and last name, phone, e-mail, password (stored hashed), profile photo if you add one, account type (individual, craftsman, developer, company and ICE). Orders: products, amounts, delivery address and point, payment method, history and balance. Service requests and craftsmen’s jobs: description, address, photos. Messages to customer service and questions to the assistant (text, and voice if you use the microphone). Device: notification token, language and technical crash reports. We never collect full card details: card payment happens on the secure CMI platform.'],
      ['3. App permissions', 'Location: only while the app is open, to place your delivery or job address on the map and, for team drivers who turn it on, to share the vehicle’s position during a delivery run. Camera and photos: product photo search, profile photo, request and job photos; only the photos you choose are sent. Microphone: spoken questions to the assistant and voice search, only while you speak. Face ID / fingerprint: quick unlock; your face or fingerprint never leaves your phone. Notifications: order tracking and messages. Each permission is optional and can be withdrawn in the phone’s settings.'],
      ['4. Why we use it', 'To create and secure your account (confirmation codes), process and deliver your orders, keep you informed (driver departure, arrival soon), handle payments, balance and discounts, answer your requests, connect customers and craftsmen, and improve and fix the app. No data is sold or used for targeted advertising or cross-app tracking.'],
      ['5. Delivery tracking', 'During a delivery, the vehicle’s position (the vehicle’s GPS box or the driver’s phone) is used to estimate the arrival time. To protect everyone’s privacy, a customer only sees the vehicle on the map once it is within 3 km of their address; before that, only the estimated arrival is shown. Trip history is erased after 30 days.'],
      ['6. Service providers', 'We share only what is needed with: Meta (WhatsApp) and our SMS and e-mail providers to send confirmation codes; CMI for card payment; OpenAI to answer questions asked to the assistant (the text or voice of the question, without your name or contact details); Google (Google sign-in if you choose it, maps); Sentry for crash reports; Expo to deliver notifications and app updates; our GPS box provider for company vehicles. These providers may process data outside Morocco under their own protection commitments.'],
      ['7. Retention', 'Account data is kept as long as the account exists. Accounting and commercial documents (invoices, delivery notes, payments) are kept 10 years as required by law. Confirmation codes expire within minutes. Vehicle positions are erased after 30 days.'],
      ['8. Delete your account', 'In the app: Account › Delete my account, then confirm (with your password if your account has one). Without the app: send “Delete my account” with your phone number or e-mail on WhatsApp to +212 6 50 02 22 42 or to boukir.diamond23@gmail.com; we check it is really you and delete the account within 7 days. Deletion erases your access, sign-in details, photo, addresses, cart, favourites and registered devices. Only the accounting documents the law requires us to keep are retained, with no online access.', DELETION_ANCHOR],
      ['9. Your rights', 'You may access your data, have it corrected, object to processing or request erasure by writing to us at the contact details above. You may also contact Morocco’s data protection authority (CNDP, www.cndp.ma).'],
      ['10. Security and minors', 'Traffic is encrypted (HTTPS), passwords are stored hashed and access to data is limited to the staff who need it. The service is intended for adults, not for children.'],
      ['11. Changes', 'We update this page when our practices change; the date at the top shows the latest version.'],
    ],
  },
  ar: {
    title: 'سياسة الخصوصية',
    intro: 'توضح هذه السياسة البيانات التي تجمعها BOUKIR DIAMOND CONSTRUCTION STORE (شركة ذات مسؤولية محدودة، طنجة) على boukirdiamond.com وفي تطبيق Boukir Diamond، ولماذا، ومع من تتم مشاركتها، وكيفية ممارسة حقوقك، وفقًا للقانون المغربي رقم 09-08.',
    updated: 'آخر تحديث: 26 نونبر 2026',
    contents: 'المحتويات',
    sections: [
      ['1. المسؤول عن المعالجة', 'BOUKIR DIAMOND CONSTRUCTION STORE، إقامة رضوان 1، عزيب الحاج قدور، محل 1 ورقم 2، طنجة، المغرب. للتواصل: boukir.diamond23@gmail.com أو +212 677 725 602 (هاتف وواتساب).'],
      ['2. البيانات التي نجمعها', 'الحساب: الاسم والنسب، الهاتف، البريد الإلكتروني، كلمة المرور (مخزنة مشفرة)، صورة الملف الشخصي إن أضفتها، نوع الحساب. الطلبات: المنتجات، المبالغ، عنوان ونقطة التوصيل، طريقة الأداء، السجل والرصيد. طلبات الخدمة ومهام الحرفيين: الوصف، العنوان، الصور. الرسائل إلى خدمة العملاء والأسئلة الموجهة للمساعد (نص، وصوت إذا استعملت الميكروفون). الجهاز: معرّف الإشعارات، اللغة وتقارير الأعطال التقنية. لا نجمع أبدًا بيانات البطاقة البنكية كاملة: يتم الأداء بالبطاقة على منصة CMI الآمنة.'],
      ['3. أذونات التطبيق', 'الموقع: فقط عندما يكون التطبيق مفتوحًا، لتحديد عنوان التوصيل أو التدخل على الخريطة، وللسائقين الذين يفعّلونه، لمشاركة موقع المركبة أثناء الجولة. الكاميرا والصور: البحث عن منتج بالصورة، صورة الملف، صور الطلبات والمهام؛ تُرسل فقط الصور التي تختارها. الميكروفون: الأسئلة الصوتية للمساعد والبحث الصوتي، فقط أثناء حديثك. Face ID / البصمة: فتح سريع؛ لا يغادر وجهك أو بصمتك هاتفك أبدًا. الإشعارات: تتبع الطلب والرسائل. كل إذن اختياري ويمكن سحبه من إعدادات الهاتف.'],
      ['4. لماذا نستعملها', 'لإنشاء حسابك وتأمينه (رموز التأكيد)، ومعالجة طلباتك وتوصيلها، وإخبارك بتقدمها، وتدبير الأداءات والرصيد والتخفيضات، والرد على طلباتك، والربط بين العملاء والحرفيين، وتحسين التطبيق وإصلاحه. لا تُباع أي بيانات ولا تُستعمل للإشهار الموجه أو للتتبع بين التطبيقات.'],
      ['5. تتبع التوصيل', 'أثناء التوصيل، يُستعمل موقع المركبة (جهاز GPS أو هاتف السائق) لتقدير وقت الوصول. حمايةً لخصوصية الجميع، لا يرى العميل المركبة على الخريطة إلا عندما تكون على بعد أقل من 3 كلم من عنوانه؛ قبل ذلك يُعرض تقدير الوصول فقط. يُمسح سجل الرحلات بعد 30 يومًا.'],
      ['6. مقدمو الخدمات', 'نشارك فقط ما هو ضروري مع: Meta (واتساب) ومزودي الرسائل القصيرة والبريد لإرسال رموز التأكيد؛ CMI للأداء بالبطاقة؛ OpenAI للإجابة عن أسئلة المساعد (نص السؤال أو صوته، دون اسمك أو بياناتك)؛ Google (تسجيل الدخول بـ Google إن اخترته، الخرائط)؛ Sentry لتقارير الأعطال؛ Expo للإشعارات وتحديثات التطبيق؛ مزود أجهزة GPS لمركبات الشركة. قد تتم المعالجة خارج المغرب وفق التزامات الحماية الخاصة بهم.'],
      ['7. مدة الحفظ', 'تُحفظ بيانات الحساب ما دام الحساب موجودًا. تُحفظ الوثائق المحاسبية والتجارية 10 سنوات كما يفرض القانون. تنتهي رموز التأكيد خلال دقائق. تُمسح مواقع المركبات بعد 30 يومًا.'],
      ['8. حذف حسابك', 'في التطبيق: الحساب › حذف حسابي، ثم أكّد (بكلمة المرور إن كان لحسابك كلمة مرور). بدون التطبيق: أرسل «حذف حسابي» مع رقم هاتفك أو بريدك عبر واتساب إلى +212 677 725 602 أو إلى boukir.diamond23@gmail.com؛ نتحقق من هويتك ونحذف الحساب خلال 7 أيام. يمحو الحذف وصولك وبيانات تسجيل الدخول والصورة والعناوين والسلة والمفضلات والأجهزة المسجلة. تُحفظ فقط الوثائق المحاسبية التي يفرض القانون الاحتفاظ بها، دون أي وصول عبر الإنترنت.', DELETION_ANCHOR],
      ['9. حقوقك', 'يمكنك الولوج إلى بياناتك وتصحيحها والتعرض على معالجتها أو طلب حذفها بمراسلتنا. يمكنك أيضًا اللجوء إلى اللجنة الوطنية لمراقبة حماية المعطيات ذات الطابع الشخصي (CNDP، www.cndp.ma).'],
      ['10. الأمان والقاصرون', 'الاتصالات مشفرة (HTTPS)، وكلمات المرور مخزنة مشفرة، والولوج إلى البيانات محصور في الفريق المعني. الخدمة موجهة للراشدين وليست للأطفال.'],
      ['11. التعديلات', 'نحدّث هذه الصفحة عند تغيّر ممارساتنا؛ يشير التاريخ أعلاه إلى آخر نسخة.'],
    ],
  },
  zh: {
    title: '隐私政策',
    intro: '本政策说明 BOUKIR DIAMOND CONSTRUCTION STORE（有限责任公司，丹吉尔）在 boukirdiamond.com 及 Boukir Diamond 应用中收集哪些数据、用途、与谁共享以及如何行使您的权利，依据摩洛哥第 09-08 号法律。',
    updated: '更新于 2026 年 11 月 26 日',
    contents: '目录',
    sections: [
      ['1. 数据控制者', 'BOUKIR DIAMOND CONSTRUCTION STORE，IKAMAT REDOUAN 1, AZIB HAJ KADDOUR, LOCAL 1 ET N° 2，摩洛哥丹吉尔。联系方式：boukir.diamond23@gmail.com 或 +212 6 50 02 22 42（电话及 WhatsApp）。'],
      ['2. 我们收集的数据', '账户：姓名、电话、电子邮件、密码（加密存储）、头像（如您添加）、账户类型。订单：商品、金额、送货地址及位置、付款方式、历史及余额。服务请求及工匠任务：描述、地址、照片。发给客服的消息及向助手提出的问题（文字，如使用麦克风则包括语音）。设备：通知标识、语言及技术崩溃报告。我们不收集完整的银行卡信息：刷卡付款在 CMI 安全平台完成。'],
      ['3. 应用权限', '位置：仅在应用打开时使用，用于在地图上标记送货或施工地址；对开启此功能的团队司机，在配送途中共享车辆位置。相机和照片：拍照搜索商品、头像、请求和任务照片；仅发送您选择的照片。麦克风：向助手提出语音问题及语音搜索，仅在您说话时使用。面容 ID / 指纹：快速解锁；您的面容或指纹不会离开手机。通知：订单跟踪和消息。所有权限均为可选，可在手机设置中撤回。'],
      ['4. 使用目的', '创建并保护您的账户（验证码）、处理和配送订单、告知进度、管理付款、余额和折扣、回复请求、连接客户与工匠、改进和修复应用。我们不出售数据，也不用于定向广告或跨应用跟踪。'],
      ['5. 配送跟踪', '配送期间，车辆位置（车载 GPS 或司机手机）用于估算到达时间。为保护所有人的隐私，客户仅在车辆距其地址 3 公里以内时才能在地图上看到车辆；在此之前只显示预计到达时间。行程记录 30 天后删除。'],
      ['6. 服务提供商', '我们仅与以下方共享必要数据：Meta（WhatsApp）及短信和邮件服务商（发送验证码）；CMI（刷卡付款）；OpenAI（回答向助手提出的问题，仅含问题的文字或语音，不含您的姓名或联系方式）；Google（如您选择 Google 登录，以及地图）；Sentry（崩溃报告）；Expo（推送通知和应用更新）；公司车辆的 GPS 设备提供商。这些服务商可能在摩洛哥境外处理数据，并遵守其保护承诺。'],
      ['7. 保存期限', '账户数据在账户存在期间保存。会计及商业单据依法保存 10 年。验证码几分钟内失效。车辆位置 30 天后删除。'],
      ['8. 删除您的账户', '在应用中：账户 › 删除我的账户，然后确认（如账户设有密码需输入密码）。无法使用应用时：通过 WhatsApp 向 +212 6 50 02 22 42 或发邮件至 boukir.diamond23@gmail.com 发送“删除我的账户”及您的电话或邮箱；核实身份后我们将在 7 天内删除账户。删除将清除您的访问权限、登录信息、头像、地址、购物车、收藏及已登记设备。仅保留法律要求的会计单据，且不提供任何在线访问。', DELETION_ANCHOR],
      ['9. 您的权利', '您可以通过上述联系方式访问、更正您的数据，反对处理或要求删除。您也可以向摩洛哥个人数据保护委员会（CNDP，www.cndp.ma）投诉。'],
      ['10. 安全与未成年人', '通信经过加密（HTTPS），密码加密存储，数据访问仅限于需要的员工。本服务面向成年人，不面向儿童。'],
      ['11. 变更', '当我们的做法发生变化时会更新本页面；页面顶部的日期为最新版本。'],
    ],
  },
}
