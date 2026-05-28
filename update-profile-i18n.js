const fs = require('fs');

const arPath = './i18n/ar.json';
const enPath = './i18n/en.json';
const frPath = './i18n/fr.json';

const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));

const arProfile = {
  error: {
    notFound: "المستخدم غير موجود",
    notFoundDesc: "لم نتمكن من العثور على",
    browseJobs: "تصفح المشاريع",
    title: "حدث خطأ",
    desc: "حدث خطأ أثناء تحميل الصفحة. يرجى المحاولة مرة أخرى.",
    home: "الصفحة الرئيسية"
  },
  timeAgo: {
    today: "اليوم",
    yesterday: "أمس",
    days: "منذ {{count}} يوم",
    months: "منذ {{count}} شهر",
    years: "منذ {{count}} سنة"
  },
  verified: "حساب موثق رسمياً",
  roles: {
    freelancer: "🧑‍💻 مستقل",
    client: "💼 صاحب عمل"
  },
  memberSince: "عضو منذ",
  actions: {
    message: "💬 أرسل رسالة",
    hire: "💼 وظّفني",
    edit: "✏️ تعديل الملف"
  },
  sections: {
    bio: "نبذة عني",
    noBio: "لم يتم إضافة نبذة بعد",
    skills: "المهارات",
    stats: "إحصائيات",
    portfolio: "معرض الأعمال",
    completedProjects: "المشاريع المكتملة",
    reviews: "التقييمات"
  },
  stats: {
    completedProjects: "مشروع مكتمل",
    reviews: "تقييم",
    hourlyRate: "السعر بالساعة",
    hourlyRateUnit: "دج/ساعة"
  },
  portfolio: {
    items: "أعمال",
    noItems: "لم يقم بإضافة أي أعمال لمعرضه بعد",
    viewProject: "عرض المشروع"
  },
  projects: {
    count: "مشروع",
    noProjects: "لا توجد مشاريع مكتملة بعد",
    completedBadge: "مكتمل ✓",
    forClient: "لصالح: ",
    byFreelancer: "المستقل: "
  },
  reviews: {
    noReviews: "لا توجد تقييمات بعد",
    anonymous: "مستخدم مجهول"
  },
  wilayas: {
    1: "أدرار", 2: "الشلف", 3: "الأغواط", 4: "أم البواقي", 5: "باتنة",
    6: "بجاية", 7: "بسكرة", 8: "بشار", 9: "البليدة", 10: "البويرة",
    11: "تمنراست", 12: "تبسة", 13: "تلمسان", 14: "تيارت", 15: "تيزي وزو",
    16: "الجزائر", 17: "الجلفة", 18: "جيجل", 19: "سطيف", 20: "سعيدة",
    21: "سكيكدة", 22: "سيدي بلعباس", 23: "عنابة", 24: "قالمة", 25: "قسنطينة",
    26: "المدية", 27: "مستغانم", 28: "المسيلة", 29: "معسكر", 30: "ورقلة",
    31: "وهران", 32: "البيض", 33: "إليزي", 34: "برج بوعريريج", 35: "بومرداس",
    36: "الطارف", 37: "تندوف", 38: "تيسمسيلت", 39: "الوادي", 40: "خنشلة",
    41: "سوق أهراس", 42: "تيبازة", 43: "ميلة", 44: "عين الدفلى", 45: "النعامة",
    46: "عين تموشنت", 47: "غرداية", 48: "غليزان",
    49: "تيميمون", 50: "برج باجي مختار", 51: "أولاد جلال", 52: "بني عباس",
    53: "عين صالح", 54: "عين قزام", 55: "تقرت", 56: "جانت", 57: "المغير", 58: "المنيعة"
  }
};

const enProfile = {
  error: {
    notFound: "User Not Found",
    notFoundDesc: "We could not find",
    browseJobs: "Browse Projects",
    title: "An Error Occurred",
    desc: "An error occurred while loading the page. Please try again.",
    home: "Home Page"
  },
  timeAgo: {
    today: "Today",
    yesterday: "Yesterday",
    days: "{{count}} days ago",
    months: "{{count}} months ago",
    years: "{{count}} years ago"
  },
  verified: "Officially Verified Account",
  roles: {
    freelancer: "🧑‍💻 Freelancer",
    client: "💼 Client"
  },
  memberSince: "Member since",
  actions: {
    message: "💬 Send Message",
    hire: "💼 Hire Me",
    edit: "✏️ Edit Profile"
  },
  sections: {
    bio: "About Me",
    noBio: "No bio added yet",
    skills: "Skills",
    stats: "Statistics",
    portfolio: "Portfolio",
    completedProjects: "Completed Projects",
    reviews: "Reviews"
  },
  stats: {
    completedProjects: "Completed",
    reviews: "Reviews",
    hourlyRate: "Hourly Rate",
    hourlyRateUnit: "DA/hr"
  },
  portfolio: {
    items: "Items",
    noItems: "No portfolio items added yet",
    viewProject: "View Project"
  },
  projects: {
    count: "Projects",
    noProjects: "No completed projects yet",
    completedBadge: "Completed ✓",
    forClient: "For: ",
    byFreelancer: "Freelancer: "
  },
  reviews: {
    noReviews: "No reviews yet",
    anonymous: "Anonymous User"
  },
  wilayas: {
    1: "Adrar", 2: "Chlef", 3: "Laghouat", 4: "Oum El Bouaghi", 5: "Batna",
    6: "Béjaïa", 7: "Biskra", 8: "Béchar", 9: "Blida", 10: "Bouira",
    11: "Tamanrasset", 12: "Tébessa", 13: "Tlemcen", 14: "Tiaret", 15: "Tizi Ouzou",
    16: "Algiers", 17: "Djelfa", 18: "Jijel", 19: "Sétif", 20: "Saïda",
    21: "Skikda", 22: "Sidi Bel Abbès", 23: "Annaba", 24: "Guelma", 25: "Constantine",
    26: "Médéa", 27: "Mostaganem", 28: "M'Sila", 29: "Mascara", 30: "Ouargla",
    31: "Oran", 32: "El Bayadh", 33: "Illizi", 34: "Bordj Bou Arréridj", 35: "Boumerdès",
    36: "El Tarf", 37: "Tindouf", 38: "Tissemsilt", 39: "El Oued", 40: "Khenchela",
    41: "Souk Ahras", 42: "Tipaza", 43: "Mila", 44: "Aïn Defla", 45: "Naâma",
    46: "Aïn Témouchent", 47: "Ghardaïa", 48: "Relizane",
    49: "Timimoun", 50: "Bordj Badji Mokhtar", 51: "Ouled Djellal", 52: "Béni Abbès",
    53: "In Salah", 54: "In Guezzam", 55: "Touggourt", 56: "Djanet", 57: "El M'Ghair", 58: "El Meniaa"
  }
};

const frProfile = {
  error: {
    notFound: "Utilisateur Introuvable",
    notFoundDesc: "Nous n'avons pas pu trouver",
    browseJobs: "Parcourir les Projets",
    title: "Une erreur s'est produite",
    desc: "Une erreur s'est produite lors du chargement de la page. Veuillez réessayer.",
    home: "Page d'accueil"
  },
  timeAgo: {
    today: "Aujourd'hui",
    yesterday: "Hier",
    days: "Il y a {{count}} jours",
    months: "Il y a {{count}} mois",
    years: "Il y a {{count}} ans"
  },
  verified: "Compte Officiellement Vérifié",
  roles: {
    freelancer: "🧑‍💻 Freelance",
    client: "💼 Client"
  },
  memberSince: "Membre depuis",
  actions: {
    message: "💬 Envoyer un message",
    hire: "💼 M'embaucher",
    edit: "✏️ Modifier le profil"
  },
  sections: {
    bio: "À propos de moi",
    noBio: "Aucune bio ajoutée pour le moment",
    skills: "Compétences",
    stats: "Statistiques",
    portfolio: "Portfolio",
    completedProjects: "Projets Terminés",
    reviews: "Évaluations"
  },
  stats: {
    completedProjects: "Terminés",
    reviews: "Évaluations",
    hourlyRate: "Taux Horaire",
    hourlyRateUnit: "DA/h"
  },
  portfolio: {
    items: "Réalisations",
    noItems: "Aucune réalisation ajoutée pour le moment",
    viewProject: "Voir le Projet"
  },
  projects: {
    count: "Projets",
    noProjects: "Aucun projet terminé pour le moment",
    completedBadge: "Terminé ✓",
    forClient: "Pour : ",
    byFreelancer: "Freelance : "
  },
  reviews: {
    noReviews: "Aucune évaluation pour le moment",
    anonymous: "Utilisateur Anonyme"
  },
  wilayas: {
    1: "Adrar", 2: "Chlef", 3: "Laghouat", 4: "Oum El Bouaghi", 5: "Batna",
    6: "Béjaïa", 7: "Biskra", 8: "Béchar", 9: "Blida", 10: "Bouira",
    11: "Tamanrasset", 12: "Tébessa", 13: "Tlemcen", 14: "Tiaret", 15: "Tizi Ouzou",
    16: "Alger", 17: "Djelfa", 18: "Jijel", 19: "Sétif", 20: "Saïda",
    21: "Skikda", 22: "Sidi Bel Abbès", 23: "Annaba", 24: "Guelma", 25: "Constantine",
    26: "Médéa", 27: "Mostaganem", 28: "M'Sila", 29: "Mascara", 30: "Ouargla",
    31: "Oran", 32: "El Bayadh", 33: "Illizi", 34: "Bordj Bou Arréridj", 35: "Boumerdès",
    36: "El Tarf", 37: "Tindouf", 38: "Tissemsilt", 39: "El Oued", 40: "Khenchela",
    41: "Souk Ahras", 42: "Tipaza", 43: "Mila", 44: "Aïn Defla", 45: "Naâma",
    46: "Aïn Témouchent", 47: "Ghardaïa", 48: "Relizane",
    49: "Timimoun", 50: "Bordj Badji Mokhtar", 51: "Ouled Djellal", 52: "Béni Abbès",
    53: "In Salah", 54: "In Guezzam", 55: "Touggourt", 56: "Djanet", 57: "El M'Ghair", 58: "El Meniaa"
  }
};

ar.profile = arProfile;
en.profile = enProfile;
fr.profile = frProfile;

fs.writeFileSync(arPath, JSON.stringify(ar, null, 2) + '\n');
fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n');
fs.writeFileSync(frPath, JSON.stringify(fr, null, 2) + '\n');

console.log("Profile translations added successfully.");
