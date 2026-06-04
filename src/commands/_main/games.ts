import {
  SlashCommandBuilder, ChatInputCommandInteraction,
  ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType,
} from 'discord.js';
import { Command } from '../../types';
import { buildEmbed, errorEmbed } from '../../utils/embed';
import { bold, blockquote, arabicNumeral } from '../../utils/format';
import prisma from '../../utils/prisma';
import { levels } from '../../config';
import { figures } from '../../data/figures';

const surahNames = [
  'الفاتحة', 'البقرة', 'آل عمران', 'النساء', 'المائدة', 'الأنعام', 'الأعراف',
  'الأنفال', 'التوبة', 'يونس', 'هود', 'يوسف', 'الرعد', 'إبراهيم', 'الحجر',
  'النحل', 'الإسراء', 'الكهف', 'مريم', 'طه', 'الأنبياء', 'الحج', 'المؤمنون',
  'النور', 'الفرقان', 'الشعراء', 'النمل', 'القصص', 'العنكبوت', 'الروم',
  'لقمان', 'السجدة', 'الأحزاب', 'سبأ', 'فاطر', 'يس', 'الصافات', 'ص', 'الزمر',
  'غافر', 'فصلت', 'الشورى', 'الزخرف', 'الدخان', 'الجاثية', 'الأحقاف', 'محمد',
  'الفتح', 'الحجرات', 'ق', 'الذاريات', 'الطور', 'النجم', 'القمر', 'الرحمن',
  'الواقعة', 'الحديد', 'المجادلة', 'الحشر', 'الممتحنة', 'الصف', 'الجمعة',
  'المنافقون', 'التغابن', 'الطلاق', 'التحريم', 'الملك', 'القلم', 'الحاقة',
  'المعارج', 'نوح', 'الجن', 'المزمل', 'المدثر', 'القيامة', 'الإنسان',
  'المرسلات', 'النبأ', 'النازعات', 'عبس', 'التكوير', 'الانفطار', 'المطففين',
  'الانشقاق', 'البروج', 'الطارق', 'الأعلى', 'الغاشية', 'الفجر', 'البلد',
  'الشمس', 'الليل', 'الضحى', 'الشرح', 'التين', 'العلق', 'القدر', 'البينة',
  'الزلزلة', 'العاديات', 'القارعة', 'التكاثر', 'العصر', 'الهمزة', 'الفيل',
  'قريش', 'الماعون', 'الكوثر', 'الكافرون', 'النصر', 'المسد', 'الإخلاص',
  'الفلق', 'الناس',
];

interface SpeedQuestion {
  question: string;
  choices: string[];
  correct: number;
}

const bank: SpeedQuestion[] = [
  { question: 'كم عدد أركان الإسلام؟', choices: ['3', '4', '5', '6'], correct: 2 },
  { question: 'كم عدد أركان الإيمان؟', choices: ['4', '5', '6', '7'], correct: 2 },
  { question: 'ما أول سورة في القرآن؟', choices: ['البقرة', 'الفاتحة', 'العلق', 'الناس'], correct: 1 },
  { question: 'كم عدد أجزاء القرآن؟', choices: ['20', '25', '30', '60'], correct: 2 },
  { question: 'ما أعظم آية في القرآن؟', choices: ['آية الكرسي', 'آية الدين', 'آية الميراث', 'آية النور'], correct: 0 },
  { question: 'ما السورة التي تسمى قلب القرآن؟', choices: ['يس', 'الرحمن', 'البقرة', 'الإخلاص'], correct: 0 },
  { question: 'كم عدد الأنبياء المذكورين في القرآن؟', choices: ['25', '28', '30', '124000'], correct: 0 },
  { question: 'ما أطول سورة في القرآن؟', choices: ['آل عمران', 'البقرة', 'النساء', 'الأعراف'], correct: 1 },
  { question: 'ما أقصر سورة في القرآن؟', choices: ['الإخلاص', 'الكوثر', 'العصر', 'النصر'], correct: 1 },
  { question: 'في أي ليلة نزل القرآن؟', choices: ['ليلة القدر', 'ليلة الإسراء', 'ليلة المعراج', 'ليلة الجمعة'], correct: 0 },
  { question: 'ما السورة التي تعدل ثلث القرآن؟', choices: ['الفاتحة', 'الإخلاص', 'يس', 'الملك'], correct: 1 },
  { question: 'من أول الأنبياء؟', choices: ['نوح', 'إبراهيم', 'آدم', 'موسى'], correct: 2 },
  { question: 'من خاتم الأنبياء؟', choices: ['عيسى', 'محمد ﷺ', 'موسى', 'إبراهيم'], correct: 1 },
  { question: 'أين نزل الوحي أول مرة؟', choices: ['غار ثور', 'غار حراء', 'المسجد الحرام', 'المسجد الأقصى'], correct: 1 },
  { question: 'كم مرة ذكرت كلمة "الدنيا" في القرآن؟', choices: ['100', '115', '120', '145'], correct: 1 },
  { question: 'كم مرة ذكرت كلمة "الآخرة" في القرآن؟', choices: ['100', '115', '120', '145'], correct: 1 },
  { question: 'ما السورة التي تسمى عروس القرآن؟', choices: ['الرحمن', 'يس', 'طه', 'الملك'], correct: 0 },
  { question: 'كم عدد السجدات في القرآن؟', choices: ['11', '13', '15', '17'], correct: 2 },
  { question: 'من أول من آمن من الرجال؟', choices: ['عمر', 'علي', 'أبو بكر', 'حمزة'], correct: 2 },
  { question: 'من أول من آمن من النساء؟', choices: ['فاطمة', 'عائشة', 'خديجة', 'مريم'], correct: 2 },
  { question: 'ما السورة التي بدأت بـ "الم"؟', choices: ['البقرة فقط', 'آل عمران فقط', 'البقرة وآل عمران', 'العنكبوت فقط'], correct: 2 },
  { question: 'ما أكبر آية في القرآن؟', choices: ['آية الكرسي', 'آية الدين', 'آية الميراث', 'آية النور'], correct: 1 },
  { question: 'كم عدد سور القرآن؟', choices: ['112', '113', '114', '115'], correct: 2 },
  { question: 'كم عدد أحزاب القرآن؟', choices: ['30', '40', '50', '60'], correct: 3 },
  { question: 'ما السورة التي تبدأ بالتسمية مرتين؟', choices: ['التوبة', 'الفاتحة', 'النمل', 'البقرة'], correct: 2 },
  { question: 'ما السورة التي لم تبدأ بالبسملة؟', choices: ['التوبة', 'النمل', 'الفاتحة', 'البقرة'], correct: 0 },
  { question: 'من أول من كتب الوحي؟', choices: ['عمر بن الخطاب', 'أبو بكر الصديق', 'عثمان بن عفان', 'علي بن أبي طالب'], correct: 2 },
  { question: 'في أي غزوة نزل قوله تعالى "ويوم حنين إذ أعجبتكم كثرتكم"؟', choices: ['بدر', 'أحد', 'حنين', 'الخندق'], correct: 2 },
  { question: 'كم مرة ورد اسم محمد في القرآن؟', choices: ['2', '4', '6', '8'], correct: 1 },
  { question: 'ما الحرف الذي لم يرد في سورة الفاتحة؟', choices: ['ف', 'ظ', 'ث', 'خ'], correct: 1 },
  { question: 'ما السورة التي تسمى سورة النساء الصغرى؟', choices: ['الطلاق', 'المجادلة', 'الممتحنة', 'التحريم'], correct: 0 },
  { question: 'كم عدد الغزوات التي شارك فيها النبي ﷺ؟', choices: ['27', '25', '23', '29'], correct: 0 },
  { question: 'كم عدد أحاديث صحيح البخاري تقريباً؟', choices: ['7000', '6000', '8000', '9000'], correct: 0 },
  { question: 'ما السورة التي كانت سبب إسلام عمر بن الخطاب؟', choices: ['البقرة', 'طه', 'يس', 'مريم'], correct: 1 },
  { question: 'من أول من جهر بالقرآن في مكة؟', choices: ['عمر', 'عبد الله بن مسعود', 'حمزة', 'أبو بكر'], correct: 1 },
  { question: 'كم سنة استمر نزول الوحي؟', choices: ['20', '23', '25', '22'], correct: 1 },
  { question: 'في أي ركن تبدأ "لبيك اللهم لبيك"؟', choices: ['الصلاة', 'الصوم', 'الحج', 'الزكاة'], correct: 2 },
  { question: 'من الصحابي الملقب بـ "سيف الله المسلول"؟', choices: ['حمزة', 'خالد بن الوليد', 'عمر', 'أبو عبيدة'], correct: 1 },
  { question: 'ما السورة التي تسمى "براءة"؟', choices: ['الفتح', 'التوبة', 'المائدة', 'الصف'], correct: 1 },
  { question: 'من أول مؤذن في الإسلام؟', choices: ['عمر', 'بلال', 'ابن أم مكتوم', 'أبو محذورة'], correct: 1 },
];

interface AyahQuestion {
  start: string;
  completion: string;
  surah: string;
  choices: string[];
  correct: number;
}

const ayahQuestions: AyahQuestion[] = [
  { start: 'إِيَّاكَ نَعْبُدُ', completion: 'وَإِيَّاكَ نَسْتَعِينُ', surah: 'الفاتحة', choices: ['وإياك نستعين', 'وإياك نستغفر', 'وإياك نتوكل', 'وإياك نسأل'], correct: 0 },
  { start: 'اهدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', completion: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ', surah: 'الفاتحة', choices: ['صراط الذين أنعمت عليهم', 'صراط المؤمنين', 'صراط الذين أنعمت عليهم غير المغضوب عليهم', 'صراط الأنبياء'], correct: 2 },
  { start: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ', completion: 'وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ', surah: 'البقرة - آية الكرسي', choices: ['ولا نوم له ما في السماوات وما في الأرض', 'ولا نوم وهو العلي العظيم', 'ولا نوم وهو على كل شيء قدير', 'ولا نوم وهو السميع العليم'], correct: 0 },
  { start: 'إِنَّمَا يَخْشَى اللَّهَ مِنْ عِبَادِهِ', completion: 'الْعُلَمَاءُ ۗ إِنَّ اللَّهَ عَزِيزٌ غَفُورٌ', surah: 'فاطر', choices: ['العلماء', 'المؤمنون', 'الصالحون', 'المتقون'], correct: 0 },
  { start: 'فَاذْكُرُونِي أَذْكُرْكُمْ', completion: 'وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ', surah: 'البقرة', choices: ['واشكروا لي ولا تكفرون', 'واشكروا لي وأحسنوا', 'واشكروا لي واتقون', 'واشكروا لي وارحمون'], correct: 0 },
  { start: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ', completion: 'وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ', surah: 'البقرة', choices: ['والصلاة إن الله مع الصابرين', 'والصلاة إن الله غفور رحيم', 'والصلاة إن الله سميع عليم', 'والصلاة إن الله عزيز حكيم'], correct: 0 },
  { start: 'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ', completion: 'حَسْبُهُ ۚ إِنَّ اللَّهَ بَالِغُ أَمْرِهِ ۚ قَدْ جَعَلَ اللَّهُ لِكُلِّ شَيْءٍ قَدْرًا', surah: 'الطلاق', choices: ['حسبه إن الله بالغ أمره', 'كافيه إن الله ناصر أمره', 'حسبه إن الله لطيف خبير', 'كافيه إن الله قوي عزيز'], correct: 0 },
  { start: 'رَبَّنَا لَا تُؤَاخِذْنَا إِن نَّسِينَا أَوْ', completion: 'أَخْطَأْنَا ۚ رَبَّنَا وَلَا تَحْمِلْ عَلَيْنَا إِصْرًا كَمَا حَمَلْتَهُ عَلَى الَّذِينَ مِن قَبْلِنَا', surah: 'البقرة', choices: ['أخطأنا', 'ظلمنا', 'جهلنا', 'غفلنا'], correct: 0 },
  { start: 'وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ', completion: 'مِن مُّدَّكِرٍ', surah: 'القمر', choices: ['من مدكر', 'من شاكر', 'من متعظ', 'من ذاكر'], correct: 0 },
  { start: 'فَإِنَّ مَعَ الْعُسْرِ', completion: 'يُسْرًا', surah: 'الشرح', choices: ['يسراً', 'فرجاً', 'رحمة', 'خيراً'], correct: 0 },
  { start: 'إِنَّ رَحْمَتَ اللَّهِ قَرِيبٌ مِّنَ', completion: 'الْمُحْسِنِينَ', surah: 'الأعراف', choices: ['المحسنين', 'المتقين', 'المؤمنين', 'الصابرين'], correct: 0 },
  { start: 'وَقَضَىٰ رَبُّكَ أَلَّا تَعْبُدُوا إِلَّا إِيَّاهُ', completion: 'وَبِالْوَالِدَيْنِ إِحْسَانًا', surah: 'الإسراء', choices: ['وبالوالدين إحساناً', 'وبالوالدين براً', 'وبالوالدين خيراً', 'وبالوالدين طاعة'], correct: 0 },
  { start: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اتَّقُوا اللَّهَ وَكُونُوا مَعَ', completion: 'الصَّادِقِينَ', surah: 'التوبة', choices: ['الصادقين', 'الصابرين', 'المؤمنين', 'المتقين'], correct: 0 },
  { start: 'إِنَّ اللَّهَ يُحِبُّ التَّوَّابِينَ وَيُحِبُّ', completion: 'الْمُتَطَهِّرِينَ', surah: 'البقرة', choices: ['المتطهرين', 'المتقين', 'المحسنين', 'الصابرين'], correct: 0 },
  { start: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ', completion: 'الْقُلُوبُ', surah: 'الرعد', choices: ['القلوب', 'النفوس', 'الأرواح', 'الأفئدة'], correct: 0 },
  { start: 'قُلْ هُوَ اللَّهُ أَحَدٌ', completion: 'اللَّهُ الصَّمَدُ', surah: 'الإخلاص', choices: ['الله الصمد', 'الله الواحد', 'الله الفرد', 'الله الأحد'], correct: 0 },
  { start: 'وَمَا خَلَقْتُ الْجِنَّ وَالْإِنسَ إِلَّا', completion: 'لِيَعْبُدُونِ', surah: 'الذاريات', choices: ['ليعبدون', 'ليرحمون', 'ليؤمنون', 'ليطيعون'], correct: 0 },
  { start: 'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ', completion: 'مَخْرَجًا', surah: 'الطلاق', choices: ['مخرجاً', 'فرجاً', 'خيراً', 'أجراً'], correct: 0 },
  { start: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً', completion: 'وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ', surah: 'البقرة', choices: ['وفي الآخرة حسنة وقنا عذاب النار', 'وفي الآخرة حسنة وارحمنا', 'وفي الآخرة حسنة واغفر لنا', 'وفي الآخرة حسنة وأدخلنا الجنة'], correct: 0 },
  { start: 'وَالْعَصْرِ * إِنَّ الْإِنسَانَ لَفِي', completion: 'خُسْرٍ', surah: 'العصر', choices: ['خسر', 'عسر', 'ضلال', 'لهو'], correct: 0 },
];

interface TestQuestion {
  question: string;
  choices: string[];
  correct: number;
  topic: string;
}

const testBank: TestQuestion[] = [
  { question: 'ما معنى التوحيد؟', choices: ['إفراد الله بالعبادة', 'معرفة الله فقط', 'محبة الله', 'ذكر الله'], correct: 0, topic: 'توحيد' },
  { question: 'كم قسمًا من التوحيد؟', choices: ['قسم واحد', 'قسمان', 'ثلاثة أقسام', 'أربعة أقسام'], correct: 2, topic: 'توحيد' },
  { question: 'ما توحيد الربوبية؟', choices: ['إفراد الله بالأفعال', 'إفراد الله بالعبادة', 'إفراد الله بالأسماء', 'إفراد الله بالخلق'], correct: 0, topic: 'توحيد' },
  { question: 'ما أعظم ذنب في الإسلام؟', choices: ['الزنا', 'السرقة', 'الشرك بالله', 'عقوق الوالدين'], correct: 2, topic: 'توحيد' },
  { question: 'ما أول واجب على المكلف؟', choices: ['الصلاة', 'الصوم', 'الشهادتان', 'الحج'], correct: 2, topic: 'توحيد' },
  { question: 'ما حكم الوضوء عند وجود الحدث؟', choices: ['سنة', 'مستحب', 'واجب', 'مندوب'], correct: 2, topic: 'فقه' },
  { question: 'كم عدد فروض الوضوء؟', choices: ['أربعة', 'خمسة', 'ستة', 'سبعة'], correct: 2, topic: 'فقه' },
  { question: 'كم عدد أركان الصلاة؟', choices: ['أحد عشر', 'أربعة عشر', 'اثنا عشر', 'خمسة عشر'], correct: 1, topic: 'فقه' },
  { question: 'ما حكم الجمعة على المسافر؟', choices: ['فرض', 'سنة', 'لا تجب', 'محرمة'], correct: 2, topic: 'فقه' },
  { question: 'صلاة الوتر كم أقلها؟', choices: ['ركعة', 'ركعتان', 'ثلاث', 'خمس'], correct: 0, topic: 'فقه' },
  { question: 'كم مقدار زكاة الفطر؟', choices: ['مد', 'صاع', 'كيلو', 'نصف صاع'], correct: 1, topic: 'فقه' },
  { question: 'ما مبطلات الصيام؟', choices: ['الأكل ناسياً', 'الجماع عمداً', 'القيء بغير عمد', 'الحلم'], correct: 1, topic: 'فقه' },
  { question: 'ما معنى "الرحمن" في سورة الفاتحة؟', choices: ['الراحم', 'شديد الرحمة', 'ذي الرحمة الواسعة', 'الراحم لعباده'], correct: 2, topic: 'تفسير' },
  { question: 'سورة الكوثر نزلت في...', choices: ['الرد على المشركين', 'فضائل النبي', 'العاص بن وائل', 'الصحابة'], correct: 2, topic: 'تفسير' },
  { question: 'ما معنى "الم"؟', choices: ['حروف مقطعة الله أعلم بها', 'ألف لام ميم', 'اسم من أسماء الله', 'قسم'], correct: 0, topic: 'تفسير' },
  { question: 'أول من يشفع للنبي صلى الله عليه وسلم...', choices: ['الصحابة', 'القرآن', 'أمته', 'الأنبياء'], correct: 1, topic: 'حديث' },
  { question: 'قال النبي صلى الله عليه وسلم: "الدين النصيحة" لمن؟', choices: ['لله ورسوله وللمسلمين', 'لله وللمؤمنين', 'لله وللناس', 'لله وللصحابة'], correct: 0, topic: 'حديث' },
  { question: 'من الذي قال له النبي صلى الله عليه وسلم: "لا تغضب"؟', choices: ['أبو هريرة', 'أبو ذر', 'أبو الدرداء', 'أنس بن مالك'], correct: 1, topic: 'حديث' },
  { question: 'ما هو الحديث القدسي؟', choices: ['حديث يرويه النبي عن الله', 'حديث صحيح', 'حديث متواتر', 'حديث قديم'], correct: 0, topic: 'حديث' },
  { question: 'كم عدد أحاديث الأربعين النووية؟', choices: ['40', '41', '42', '43'], correct: 2, topic: 'حديث' },
  { question: 'في أي عام ولد النبي صلى الله عليه وسلم؟', choices: ['عام الفيل', 'عام الحزن', 'عام الوفود', 'عام الفتح'], correct: 0, topic: 'سيرة' },
  { question: 'من هي مرضعة النبي صلى الله عليه وسلم؟', choices: ['أم أيمن', 'حليمة السعدية', 'ثويبة', 'سودة'], correct: 1, topic: 'سيرة' },
  { question: 'أين كانت الهجرة الأولى للمسلمين؟', choices: ['المدينة', 'الحبشة', 'الطائف', 'مصر'], correct: 1, topic: 'سيرة' },
  { question: 'كم سنة دامت الدعوة في مكة؟', choices: ['10 سنوات', '13 سنة', '15 سنة', '20 سنة'], correct: 1, topic: 'سيرة' },
  { question: 'في أي غزوة استشهد حمزة؟', choices: ['بدر', 'أحد', 'الخندق', 'خيبر'], correct: 1, topic: 'سيرة' },
  { question: 'كم عدد غزوات النبي؟', choices: ['19', '25', '27', '30'], correct: 2, topic: 'سيرة' },
];

interface QuizQuestion {
  question: string;
  choices: string[];
  correct: number;
}

const quizEasy: QuizQuestion[] = [
  { question: 'كم عدد سور القرآن الكريم؟', choices: ['110', '114', '120', '100'], correct: 1 },
  { question: 'ما هي السورة التي تسمى قلب القرآن؟', choices: ['يس', 'الفاتحة', 'الإخلاص', 'البقرة'], correct: 0 },
  { question: 'ما هي أطول سورة في القرآن؟', choices: ['البقرة', 'آل عمران', 'النساء', 'الأعراف'], correct: 0 },
  { question: 'كم عدد أجزاء القرآن؟', choices: ['20', '25', '30', '35'], correct: 2 },
  { question: 'أي سورة تسمى عروس القرآن؟', choices: ['الرحمن', 'يس', 'الفاتحة', 'الملك'], correct: 0 },
  { question: 'في أي ليلة نزل القرآن؟', choices: ['ليلة القدر', 'ليلة الإسراء', 'ليلة النصف من شعبان', 'ليلة عرفة'], correct: 0 },
  { question: 'ما هي أول سورة نزلت في القرآن؟', choices: ['الفاتحة', 'العلق', 'القلم', 'المزمل'], correct: 1 },
  { question: 'ما هي آخر سورة نزلت؟', choices: ['النصر', 'المائدة', 'الإخلاص', 'الناس'], correct: 0 },
  { question: 'كم عدد آيات سورة الفاتحة؟', choices: ['5', '6', '7', '8'], correct: 2 },
  { question: 'ما اسم السورة التي ذكرت فيها البسملة مرتين؟', choices: ['النمل', 'الإسراء', 'هود', 'مريم'], correct: 0 },
  { question: 'ما هي أقصر سورة في القرآن؟', choices: ['الإخلاص', 'الكوثر', 'النصر', 'العصر'], correct: 1 },
  { question: 'كم عدد آيات سورة الإخلاص؟', choices: ['2', '3', '4', '5'], correct: 2 },
  { question: 'ما السورة التي إذا قرأتها فكأنما قرأت ثلث القرآن؟', choices: ['الإخلاص', 'يس', 'الملك', 'الواقعة'], correct: 0 },
  { question: 'كم عدد آيات سورة البقرة؟', choices: ['256', '260', '276', '286'], correct: 3 },
  { question: 'ما أول آية نزلت من القرآن؟', choices: ['الحمد لله رب العالمين', 'اقرأ باسم ربك', 'الم', 'تبارك الذي'], correct: 1 },
  { question: 'ما السورة التي تسمى سورة التوحيد؟', choices: ['الإخلاص', 'الفاتحة', 'الناس', 'الفلق'], correct: 0 },
  { question: 'كم عدد سور المدنية في القرآن؟', choices: ['22', '28', '30', '32'], correct: 1 },
  { question: 'من هو الصحابي الذي جمع القرآن في مصحف واحد؟', choices: ['أبو بكر الصديق', 'عمر بن الخطاب', 'عثمان بن عفان', 'علي بن أبي طالب'], correct: 2 },
  { question: 'كم عدد السجدات في القرآن؟', choices: ['12', '14', '15', '16'], correct: 2 },
  { question: 'كم مرة ذكر اسم محمد في القرآن؟', choices: ['2', '3', '4', '5'], correct: 2 },
  { question: 'كم عدد الأنبياء المذكورين في القرآن؟', choices: ['20', '25', '28', '30'], correct: 1 },
  { question: 'ما السورة التي نزلت في أبي لهب وزوجته؟', choices: ['المسد', 'الناس', 'الفلق', 'الكافرون'], correct: 0 },
  { question: 'من هو النبي الذي ابتلعه الحوت؟', choices: ['يونس', 'يوسف', 'يعقوب', 'إسماعيل'], correct: 0 },
  { question: 'ما السورة التي تسمى سورة بني إسرائيل؟', choices: ['الإسراء', 'البقرة', 'آل عمران', 'المائدة'], correct: 0 },
  { question: 'ما طول مدة نزول القرآن؟', choices: ['20 سنة', '23 سنة', '25 سنة', '22 سنة'], correct: 1 },
  { question: 'كم عدد السور التي تبدأ بـ "حم"؟', choices: ['5', '6', '7', '8'], correct: 2 },
  { question: 'أي سورة تسمى سورة المؤمن؟', choices: ['غافر', 'المؤمنون', 'الحاقة', 'الزمر'], correct: 0 },
  { question: 'كم عدد السور القرآنية التي سميت بأسماء الأنبياء؟', choices: ['7', '8', '9', '10'], correct: 1 },
  { question: 'أي سورة تبدأ بـ "إنا"؟', choices: ['الفتح', 'الكوثر', 'القدر', 'جميع ما ذكر'], correct: 3 },
  { question: 'من هو النبي الذي ذكر في القرآن أكثر من غيره؟', choices: ['موسى', 'إبراهيم', 'نوح', 'يوسف'], correct: 0 },
  { question: 'ما السورة التي تبدأ بـ "تبارك"؟', choices: ['الملك', 'الفرقان', 'الحشر', 'السجدة'], correct: 0 },
  { question: 'كم سجدة تلاوة في القرآن؟', choices: ['12', '13', '14', '15'], correct: 3 },
  { question: 'كم عدد آيات سورة الملك؟', choices: ['30', '33', '36', '39'], correct: 0 },
  { question: 'ما السورة التي تسمى الفاضحة؟', choices: ['المنافقون', 'التوبة', 'الممتحنة', 'التحريم'], correct: 3 },
  { question: 'كم عدد الحروف المقطعة في القرآن؟', choices: ['12', '13', '14', '15'], correct: 2 },
  { question: 'أي سورة تسمى سورة الموعظة؟', choices: ['يونس', 'هود', 'يوسف', 'الحجر'], correct: 1 },
  { question: 'ما معنى كلمة "الزقوم"؟', choices: ['ثمر الجنة', 'شجرة في جهنم', 'نهر في الجنة', 'طعام أهل الجنة'], correct: 1 },
  { question: 'ما السورة التي تسمى سورة النعم؟', choices: ['النحل', 'الأنعام', 'النمل', 'العنكبوت'], correct: 0 },
  { question: 'ما السورة التي تسمى سورة القتال؟', choices: ['محمد', 'الأنفال', 'آل عمران', 'التوبة'], correct: 0 },
  { question: 'كم عدد السور التي تبدأ بـ "الم"؟', choices: ['4', '5', '6', '7'], correct: 2 },
];

const quizMedium: QuizQuestion[] = [
  { question: 'ما السورة التي كل آياتها تنتهي بحرف "الدال"؟', choices: ['الإخلاص', 'المسد', 'الفاتحة', 'النصر'], correct: 0 },
  { question: 'أين نزلت سورة مريم؟', choices: ['مكة', 'المدينة', 'القدس', 'الطائف'], correct: 0 },
  { question: 'كم كلمة في القرآن الكريم؟', choices: ['حوالي 67000', 'حوالي 77000', 'حوالي 87000', 'حوالي 97000'], correct: 1 },
  { question: 'ما السورة التي تسمى سورة الأعراف نسبة إلى؟', choices: ['جبل في الجنة', 'حاجز بين الجنة والنار', 'واد في جهنم', 'قبيلة عربية'], correct: 1 },
  { question: 'ما السورة التي تبدأ بـ "سبح"؟', choices: ['الأعلى', 'الجمعة', 'التغابن', 'جميع ما ذكر'], correct: 3 },
  { question: 'كم عدد سور القرآن التي تبدأ بـ "الحمد لله"؟', choices: ['3', '4', '5', '6'], correct: 2 },
  { question: 'ما عدد آيات سورة يس؟', choices: ['80', '83', '86', '89'], correct: 1 },
  { question: 'أين ذُكرت قصة أصحاب الكهف؟', choices: ['سورة الكهف', 'سورة الإسراء', 'سورة الأنبياء', 'سورة المؤمنون'], correct: 0 },
  { question: 'ما السورة التي ورد فيها ذكر "السراج المنير"؟', choices: ['الأحزاب', 'النور', 'المزمل', 'المدثر'], correct: 0 },
  { question: 'ما معنى "الم"؟', choices: ['الله أعلم بمراده', 'ألف لام ميم', 'اسم من أسماء الله', 'حروف مقطعة'], correct: 0 },
  { question: 'كم عدد السور المكية؟', choices: ['82', '86', '85', '80'], correct: 1 },
  { question: 'ما السورة التي تسمى سورة الفرائض؟', choices: ['النساء', 'البقرة', 'المائدة', 'الأنفال'], correct: 0 },
  { question: 'كم سورة في القرآن لم يرد فيها لفظ الجلالة "الله"؟', choices: ['26', '27', '28', '29'], correct: 2 },
  { question: 'ما السورة التي تسمى سورة التوديع؟', choices: ['النصر', 'المائدة', 'الجمعة', 'التوبة'], correct: 0 },
  { question: 'ما السورة التي ورد فيها ذكر الغار؟', choices: ['التوبة', 'الأنفال', 'آل عمران', 'البقرة'], correct: 0 },
  { question: 'كم عدد السور التي تبدأ بـ "حم"؟', choices: ['5', '6', '7', '8'], correct: 2 },
  { question: 'أي سورة تبدأ بـ "عسق"؟', choices: ['الشورى', 'الصافات', 'الزخرف', 'ق'], correct: 0 },
  { question: 'ما السورة التي تسمى سورة الصف؟', choices: ['الصف', 'الجمعة', 'المنافقون', 'التغابن'], correct: 0 },
  { question: 'كم مرة تكررت كلمة "قل" في القرآن؟', choices: ['332', '342', '352', '362'], correct: 2 },
  { question: 'ما معنى "عسق"؟', choices: ['حروف مقطعة', 'اسم من أسماء الله', 'قسم من الله', 'لا يعلم تأويلها إلا الله'], correct: 0 },
  { question: 'كم عدد المواضع التي وردت فيها سجدة التلاوة في القرآن؟', choices: ['13', '14', '15', '16'], correct: 2 },
  { question: 'أي آية في القرآن تسمى آية المباهلة؟', choices: ['آل عمران 61', 'المائدة 6', 'البقرة 89', 'آل عمران 7'], correct: 0 },
  { question: 'كم عدد آيات سورة البقرة؟', choices: ['286', '285', '287', '290'], correct: 0 },
];

async function ensureUser(userId: string, username: string) {
  await prisma.user.upsert({
    where: { id: userId },
    update: { username },
    create: { id: userId, username },
  });
  await prisma.userPoint.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

function getLevel(total: number) {
  let current = levels[0];
  for (const l of levels) {
    if (total >= l.minPoints) current = l;
  }
  return current;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default {
  data: new SlashCommandBuilder()
    .setName('لعبة')
    .setDescription('أمر الألعاب الموحد')
    .addSubcommand(sub =>
      sub.setName('اختبار-ديني')
        .setDescription('اختبار ديني في مواد مختلفة')
        .addStringOption(option =>
          option.setName('المادة')
            .setDescription('اختر المادة')
            .setRequired(true)
            .addChoices(
              { name: 'توحيد', value: 'توحيد' },
              { name: 'فقه', value: 'فقه' },
              { name: 'تفسير', value: 'تفسير' },
              { name: 'حديث', value: 'حديث' },
              { name: 'سيرة', value: 'سيرة' },
            )))
    .addSubcommand(sub =>
      sub.setName('أكمل-الآية')
        .setDescription('أكمل الآية القرآنية'))
    .addSubcommand(sub =>
      sub.setName('مسابقة-قرآن')
        .setDescription('اختبر معلوماتك القرآنية')
        .addStringOption(option =>
          option.setName('المستوى')
            .setDescription('اختر مستوى الصعوبة')
            .setRequired(true)
            .addChoices(
              { name: 'سهل', value: 'سهل' },
              { name: 'متوسط', value: 'متوسط' },
            )))
    .addSubcommand(sub =>
      sub.setName('من-أنا')
        .setDescription('خمن الشخصية الإسلامية'))
    .addSubcommand(sub =>
      sub.setName('ترتيب-السور')
        .setDescription('رتب السور القرآنية حسب ترتيبها في المصحف'))
    .addSubcommand(sub =>
      sub.setName('سباق-السرعة')
        .setDescription('أسئلة دينية سريعة - أجب بأسرع ما يمكن'))
    .addSubcommand(sub =>
      sub.setName('نقاطي')
        .setDescription('عرض نقاطك ومستواك'))
    .addSubcommand(sub =>
      sub.setName('لوحة-الشرف')
        .setDescription('عرض أفضل 10 متسابقين')),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'اختبار-ديني') {
      const topic = interaction.options.getString('المادة', true);
      const pool = testBank.filter(q => q.topic === topic);

      if (pool.length < 3) {
        await interaction.reply({ embeds: [errorEmbed('لا يوجد عدد كافٍ من الأسئلة لهذه المادة.')], flags: 64 });
        return;
      }

      const questions = shuffle(pool).slice(0, 3);
      let current = 0;
      let correctCount = 0;
      let answered = false;

      async function showQuestion() {
        if (current >= questions.length) return null;
        const q = questions[current];
        const rows: ActionRowBuilder<ButtonBuilder>[] = [];
        for (let i = 0; i < 4; i += 2) {
          const row = new ActionRowBuilder<ButtonBuilder>();
          for (let j = i; j < i + 2 && j < 4; j++) {
            row.addComponents(
              new ButtonBuilder()
                .setCustomId(`test_${j}`)
                .setLabel(`${String.fromCharCode(0x0660 + j + 1)}) ${q.choices[j]}`)
                .setStyle(ButtonStyle.Primary),
            );
          }
          rows.push(row);
        }
        const embed = buildEmbed('games', {
          title: `📝 اختبار ${topic} (سؤال ${current + 1}/3)`,
          description: `**${q.question}**`,
          footer: 'لديك 20 ثانية للإجابة',
        });
        return { embeds: [embed], components: rows };
      }

      const firstMsg = await showQuestion();
      if (!firstMsg) {
        await interaction.reply({ embeds: [errorEmbed('حدث خطأ في تحميل الأسئلة.')], flags: 64 });
        return;
      }

      const reply = await interaction.reply({ ...firstMsg, fetchReply: true });
      const filter = (i: any) => i.user.id === interaction.user.id;

      while (current < questions.length) {
        try {
          const collected = await reply.awaitMessageComponent({
            filter,
            componentType: ComponentType.Button,
            time: 20000,
          });

          if (answered) { await collected.deferUpdate(); continue; }
          answered = true;

          const chosen = parseInt(collected.customId.replace('test_', ''));
          const q = questions[current];
          const isCorrect = chosen === q.correct;
          if (isCorrect) correctCount++;

          const embed = buildEmbed('games', {
            title: `📝 اختبار ${topic}`,
            description: `**${q.question}**`,
            fields: [
              { name: isCorrect ? '✅ صحيح' : `❌ خطأ • الإجابة: **${q.choices[q.correct]}**`, value: `**${correctCount}/${current + 1}**` },
            ],
          });

          await collected.update({ embeds: [embed], components: [] });
          current++;
          if (current >= questions.length) break;

          await new Promise(res => setTimeout(res, 1500));
          answered = false;

          const nextMsg = await showQuestion();
          if (nextMsg) await interaction.editReply(nextMsg);
        } catch {
          await ensureUser(interaction.user.id, interaction.user.username);
          const points = correctCount * 10;
          await prisma.gameScore.create({
            data: { userId: interaction.user.id, gameType: 'islamic-test', score: points, correct: correctCount, wrong: questions.length - correctCount },
          });
          const userPoint = await prisma.userPoint.findUnique({ where: { userId: interaction.user.id } });
          const newTotal = (userPoint?.total || 0) + points;
          const newGamePts = (userPoint?.gamePts || 0) + points;
          const currentLevel = getLevel(newTotal);
          await prisma.userPoint.update({
            where: { userId: interaction.user.id },
            data: { total: newTotal, gamePts: newGamePts, level: currentLevel.name },
          });
          await interaction.editReply({
            embeds: [buildEmbed('games', {
              title: '⏰ انتهى الاختبار',
              description: `الإجابات الصحيحة: **${correctCount}/3**`,
              fields: [
                { name: 'النقاط', value: `+${points}`, inline: true },
                { name: 'المستوى', value: currentLevel.name, inline: true },
              ],
            })],
            components: [],
          });
          return;
        }
      }

      await ensureUser(interaction.user.id, interaction.user.username);
      const points = correctCount * 10;
      const wrongCount = questions.length - correctCount;
      await prisma.gameScore.create({
        data: { userId: interaction.user.id, gameType: 'islamic-test', score: points, correct: correctCount, wrong: wrongCount },
      });
      const userPoint = await prisma.userPoint.findUnique({ where: { userId: interaction.user.id } });
      const newTotal = (userPoint?.total || 0) + points;
      const newGamePts = (userPoint?.gamePts || 0) + points;
      const currentLevel = getLevel(newTotal);
      await prisma.userPoint.update({
        where: { userId: interaction.user.id },
        data: { total: newTotal, gamePts: newGamePts, level: currentLevel.name },
      });

      await interaction.editReply({
        embeds: [buildEmbed('games', {
          title: '✅ انتهى الاختبار!',
          description: `**${topic}**`,
          fields: [
            { name: 'الإجابات الصحيحة', value: `${correctCount}/${questions.length}`, inline: true },
            { name: 'النقاط المكتسبة', value: `+${points}`, inline: true },
            { name: 'المستوى', value: currentLevel.name, inline: true },
          ],
        })],
        components: [],
      });
    } else if (sub === 'أكمل-الآية') {
      const q = ayahQuestions[Math.floor(Math.random() * ayahQuestions.length)];

      const rows: ActionRowBuilder<ButtonBuilder>[] = [];
      for (let i = 0; i < 4; i += 2) {
        const row = new ActionRowBuilder<ButtonBuilder>();
        for (let j = i; j < i + 2 && j < 4; j++) {
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`ayah_${j}`)
              .setLabel(`${String.fromCharCode(0x0660 + j + 1)}) ${q.choices[j]}`)
              .setStyle(ButtonStyle.Primary),
          );
        }
        rows.push(row);
      }

      const embed = buildEmbed('games', {
        title: '📖 أكمل الآية',
        description: `**﴿${q.start}﴾**\n\nمن سورة **${q.surah}**`,
        footer: 'اختر الإكمال الصحيح',
      });

      const reply = await interaction.reply({ embeds: [embed], components: rows, fetchReply: true });
      const filter = (i: any) => i.user.id === interaction.user.id;

      try {
        const collected = await reply.awaitMessageComponent({ filter, componentType: ComponentType.Button, time: 30000 });
        const chosen = parseInt(collected.customId.replace('ayah_', ''));
        const isCorrect = chosen === q.correct;
        await ensureUser(interaction.user.id, interaction.user.username);
        const points = isCorrect ? 10 : -2;

        await prisma.gameScore.create({
          data: { userId: interaction.user.id, gameType: 'complete-ayah', score: isCorrect ? 10 : 0, correct: isCorrect ? 1 : 0, wrong: isCorrect ? 0 : 1 },
        });

        const userPoint = await prisma.userPoint.findUnique({ where: { userId: interaction.user.id } });
        const newTotal = (userPoint?.total || 0) + points;
        const newGamePts = (userPoint?.gamePts || 0) + points;
        const currentLevel = getLevel(newTotal);
        await prisma.userPoint.update({
          where: { userId: interaction.user.id },
          data: { total: newTotal, gamePts: Math.max(0, newGamePts), level: currentLevel.name },
        });

        const fullAyah = `**﴿${q.start} ${q.completion}﴾**`;
        await collected.update({
          embeds: [buildEmbed('games', {
            title: isCorrect ? '✅ إجابة صحيحة!' : '❌ إجابة خاطئة',
            description: isCorrect ? `${fullAyah}\n\nأحسنت! +${points} نقطة` : `${fullAyah}\n\nالإجابة الصحيحة: **${q.choices[q.correct]}**`,
            fields: [
              { name: 'السورة', value: q.surah, inline: true },
              { name: 'النقاط', value: `${isCorrect ? '+' : ''}${points}`, inline: true },
              { name: 'المستوى', value: currentLevel.name, inline: true },
            ],
          })],
          components: [],
        });
      } catch {
        await interaction.editReply({
          embeds: [buildEmbed('games', {
            title: '⏰ انتهى الوقت',
            description: `**﴿${q.start} ${q.completion}﴾**\n\nمن سورة **${q.surah}**`,
          })],
          components: [],
        });
      }
    } else if (sub === 'مسابقة-قرآن') {
      const level = interaction.options.getString('المستوى', true);
      const pool = level === 'سهل' ? quizEasy : quizMedium;
      const question = pool[Math.floor(Math.random() * pool.length)];
      const shuffled = shuffle(question.choices.map((text, idx) => ({ text, origIdx: idx })));
      const correctIdx = shuffled.findIndex(s => s.origIdx === question.correct);

      const rows: ActionRowBuilder<ButtonBuilder>[] = [];
      for (let i = 0; i < 4; i += 2) {
        const row = new ActionRowBuilder<ButtonBuilder>();
        for (let j = i; j < i + 2 && j < 4; j++) {
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`quiz_${j}`)
              .setLabel(`${String.fromCharCode(0x0660 + j + 1)}) ${shuffled[j].text}`)
              .setStyle(ButtonStyle.Primary),
          );
        }
        rows.push(row);
      }

      const embed = buildEmbed('games', {
        title: `📖 مسابقة قرآنية (${level})`,
        description: `**${question.question}**`,
        footer: 'اضغط على الإجابة الصحيحة • لديك 30 ثانية',
      });

      const reply = await interaction.reply({ embeds: [embed], components: rows, fetchReply: true });
      const filter = (i: any) => i.user.id === interaction.user.id;

      try {
        const collected = await reply.awaitMessageComponent({ filter, componentType: ComponentType.Button, time: 30000 });
        const chosen = parseInt(collected.customId.replace('quiz_', ''));
        const isCorrect = chosen === correctIdx;
        await ensureUser(interaction.user.id, interaction.user.username);
        const points = isCorrect ? 10 : -3;

        await prisma.gameScore.create({
          data: { userId: interaction.user.id, gameType: 'quran-quiz', score: isCorrect ? 10 : 0, correct: isCorrect ? 1 : 0, wrong: isCorrect ? 0 : 1 },
        });

        const userPoint = await prisma.userPoint.findUnique({ where: { userId: interaction.user.id } });
        const newTotal = (userPoint?.total || 0) + points;
        const newGamePts = (userPoint?.gamePts || 0) + points;
        const currentLevel = getLevel(newTotal);
        await prisma.userPoint.update({
          where: { userId: interaction.user.id },
          data: { total: newTotal, gamePts: Math.max(0, newGamePts), level: currentLevel.name },
        });

        await collected.update({
          embeds: [buildEmbed('games', {
            title: isCorrect ? '✅ إجابة صحيحة!' : '❌ إجابة خاطئة',
            description: isCorrect ? `أحسنت! الإجابة الصحيحة: **${question.choices[question.correct]}**\n+${10} نقطة` : `الإجابة الصحيحة: **${question.choices[question.correct]}**\n${points} نقطة`,
            fields: [
              { name: 'إجمالي النقاط', value: `${newTotal}`, inline: true },
              { name: 'المستوى', value: currentLevel.name, inline: true },
            ],
          })],
          components: [],
        });
      } catch {
        await interaction.editReply({
          embeds: [buildEmbed('games', {
            title: '⏰ انتهى الوقت',
            description: `الإجابة الصحيحة: **${question.choices[question.correct]}**`,
          })],
          components: [],
        });
      }
    } else if (sub === 'من-أنا') {
      const figure = figures[Math.floor(Math.random() * figures.length)];
      let clueIndex = 0;
      let guessed = false;

      const revealBtn = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('clue').setLabel('🔍 تخمين').setStyle(ButtonStyle.Primary),
      );
      const guessBtn = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('guess').setLabel('💡 تخمين').setStyle(ButtonStyle.Success),
      );

      const embed = buildEmbed('games', {
        title: '🕋 من أنا؟',
        description: `**الدليل ١:** ${figure.clues[0]}`,
        footer: 'اضغط "تخمين" للإجابة • أو "تخمين" لكشف الدليل التالي',
      });

      const reply = await interaction.reply({ embeds: [embed], components: [revealBtn, guessBtn], fetchReply: true });
      const filter = (i: any) => i.user.id === interaction.user.id;

      const collector = reply.createMessageComponentCollector({ filter, componentType: ComponentType.Button, time: 60000 });

      collector.on('collect', async (collected) => {
        if (collected.customId === 'clue') {
          clueIndex++;
          if (clueIndex >= 3) {
            await collected.update({
              embeds: [buildEmbed('games', {
                title: '🔍 الإجابة',
                description: `**${figure.name}**\n\n${figure.desc}`,
                fields: [{ name: 'الدلائل', value: figure.clues.map((c, i) => `**${i + 1}.** ${c}`).join('\n') }],
              })],
              components: [],
            });
            collector.stop('finished');
            return;
          }
          await collected.update({
            embeds: [buildEmbed('games', {
              title: '🕋 من أنا؟',
              description: figure.clues.slice(0, clueIndex + 1).map((c, i) => `**الدليل ${i + 1}:** ${c}`).join('\n'),
              footer: 'اضغط "تخمين" للإجابة',
            })],
          });
        } else if (collected.customId === 'guess' && !guessed) {
          guessed = true;
          collector.stop('guessed');

          const points = clueIndex === 0 ? 20 : clueIndex === 1 ? 10 : 5;
          await ensureUser(interaction.user.id, interaction.user.username);

          await prisma.gameScore.create({
            data: { userId: interaction.user.id, gameType: 'who-am-i', score: points, correct: 1, wrong: 0 },
          });

          const userPoint = await prisma.userPoint.findUnique({ where: { userId: interaction.user.id } });
          const newTotal = (userPoint?.total || 0) + points;
          const newGamePts = (userPoint?.gamePts || 0) + points;
          const currentLevel = getLevel(newTotal);
          await prisma.userPoint.update({
            where: { userId: interaction.user.id },
            data: { total: newTotal, gamePts: newGamePts, level: currentLevel.name },
          });

          const allClues = figure.clues.map((c, i) => `**${i + 1}.** ${c}`).join('\n');
          await collected.update({
            embeds: [buildEmbed('games', {
              title: '🎉 إجابة صحيحة!',
              description: `**${figure.name}**\n\n${figure.desc}`,
              fields: [
                { name: 'الدلائل', value: allClues },
                { name: 'النقاط', value: `+${points}`, inline: true },
                { name: 'المستوى', value: currentLevel.name, inline: true },
              ],
            })],
            components: [],
          });
        }
      });

      collector.on('end', async (_, reason) => {
        if (reason === 'time') {
          await interaction.editReply({
            embeds: [buildEmbed('games', {
              title: '⏰ انتهى الوقت',
              description: `**${figure.name}**\n\n${figure.desc}`,
              fields: [{ name: 'الدلائل', value: figure.clues.map((c, i) => `**${i + 1}.** ${c}`).join('\n') }],
            })],
            components: [],
          });
        }
      });
    } else if (sub === 'ترتيب-السور') {
      await interaction.deferReply();
      await ensureUser(interaction.user.id, interaction.user.username);

      let round = 0;
      let score = 0;
      let correctCount = 0;
      const totalRounds = 8;

      async function showRound() {
        if (round >= totalRounds) {
          const userPoint = await prisma.userPoint.findUnique({ where: { userId: interaction.user.id } });
          const newTotal = (userPoint?.total || 0) + score;
          const newGamePts = (userPoint?.gamePts || 0) + score;
          await prisma.userPoint.update({
            where: { userId: interaction.user.id },
            data: { total: newTotal, gamePts: newGamePts },
          });
          await interaction.editReply({
            embeds: [buildEmbed('games', {
              title: 'ترتيب السور',
              description: `النتيجة النهائية: **${score}** من **${totalRounds * 10}**`,
              fields: [
                { name: 'الإجابات الصحيحة', value: `${correctCount} / ${totalRounds}`, inline: true },
                { name: 'النقاط', value: `${score}`, inline: true },
              ],
            })],
            components: [],
          });
          return;
        }

        const indices = shuffle(Array.from({ length: 114 }, (_, i) => i)).slice(0, 4);
        const correctIdx = Math.floor(Math.random() * indices.length);
        const correctIndex = indices[correctIdx];
        const labels = indices.map(i => surahNames[i]);

        const embed = buildEmbed('games', {
          title: `ترتيب السور • السؤال ${round + 1}/${totalRounds}`,
          description: `أي من هذه السور يأتي **أولاً** في ترتيب المصحف؟\n\n${labels.map((n, i) => `**${i + 1}.** ${n}`).join('\n')}`,
          fields: [{ name: 'النقاط', value: `${score}`, inline: true }],
        });

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          labels.map((_, i) =>
            new ButtonBuilder().setCustomId(`order_${i}`).setLabel(`${i + 1}`).setStyle(ButtonStyle.Primary)
          )
        );

        await interaction.editReply({ embeds: [embed], components: [row] });

        const filter = (i: any) => i.user.id === interaction.user.id;
        const collected = await interaction.channel?.awaitMessageComponent({ filter, componentType: ComponentType.Button, time: 20000 }).catch(() => null);

        if (!collected) {
          await interaction.editReply({
            embeds: [buildEmbed('games', {
              title: 'انتهى الوقت',
              description: `السورة الصحيحة: **${surahNames[correctIndex]}** (رقم ${correctIndex + 1})`,
            })],
            components: [],
          });
          round++;
          setTimeout(showRound, 2000);
          return;
        }

        const chosen = parseInt(collected.customId.replace('order_', ''));
        if (chosen === correctIdx) {
          score += 10;
          correctCount++;
          await collected.update({
            embeds: [buildEmbed('games', { title: 'إجابة صحيحة', description: `✅ السورة **${surahNames[correctIndex]}** هي رقم ${correctIndex + 1} في المصحف.` })],
            components: [],
          });
        } else {
          await collected.update({
            embeds: [buildEmbed('games', { title: 'إجابة خاطئة', description: `السورة الصحيحة: **${surahNames[correctIndex]}** (رقم ${correctIndex + 1})` })],
            components: [],
          });
        }

        round++;
        setTimeout(showRound, 2000);
      }

      showRound();
    } else if (sub === 'سباق-السرعة') {
      await interaction.deferReply();
      await ensureUser(interaction.user.id, interaction.user.username);

      const questions = bank.sort(() => Math.random() - 0.5).slice(0, 10);
      let current = 0;
      let score = 0;
      let correctCount = 0;

      async function nextQuestion() {
        if (current >= questions.length) {
          const userPoint = await prisma.userPoint.findUnique({ where: { userId: interaction.user.id } });
          const newTotal = (userPoint?.total || 0) + score;
          const newGamePts = (userPoint?.gamePts || 0) + score;
          await prisma.userPoint.update({
            where: { userId: interaction.user.id },
            data: { total: newTotal, gamePts: newGamePts },
          });
          await interaction.editReply({
            embeds: [buildEmbed('games', {
              title: 'انتهى السباق',
              description: `نتيجتك: **${score}** من **${questions.length * 15}** نقطة`,
              fields: [
                { name: 'الإجابات الصحيحة', value: `${correctCount} / ${questions.length}`, inline: true },
                { name: 'النقاط', value: `${score}`, inline: true },
              ],
            })],
            components: [],
          });
          return;
        }

        const q = questions[current];
        const embed = buildEmbed('games', {
          title: `سباق السرعة • سؤال ${current + 1}/${questions.length}`,
          description: `**${q.question}**`,
          fields: [
            { name: 'الوقت', value: '⏱ 15 ثانية', inline: true },
            { name: 'النقاط', value: `${score}`, inline: true },
          ],
        });

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          q.choices.map((choice, i) =>
            new ButtonBuilder().setCustomId(`speed_${i}`).setLabel(choice).setStyle(ButtonStyle.Primary)
          )
        );

        await interaction.editReply({ embeds: [embed], components: [row] });

        const filter = (i: any) => i.user.id === interaction.user.id;
        const collected = await interaction.channel?.awaitMessageComponent({ filter, componentType: ComponentType.Button, time: 15000 }).catch(() => null);

        if (!collected) {
          await interaction.editReply({
            embeds: [buildEmbed('games', { title: 'انتهى الوقت', description: `الإجابة الصحيحة: **${q.choices[q.correct]}**` })],
            components: [],
          });
          current++;
          setTimeout(nextQuestion, 1500);
          return;
        }

        const chosen = parseInt(collected.customId.replace('speed_', ''));
        if (chosen === q.correct) {
          score += 15;
          correctCount++;
          await collected.update({ embeds: [buildEmbed('games', { title: 'إجابة صحيحة', description: `✅ ${q.choices[q.correct]}` })], components: [] });
        } else {
          await collected.update({ embeds: [buildEmbed('games', { title: 'إجابة خاطئة', description: `✅ **${q.choices[q.correct]}**` })], components: [] });
        }

        current++;
        setTimeout(nextQuestion, 1500);
      }

      nextQuestion();
    } else if (sub === 'نقاطي') {
      const userId = interaction.user.id;
      const userPoint = await prisma.userPoint.findUnique({ where: { userId } });

      if (!userPoint) {
        await interaction.reply({ embeds: [errorEmbed('لم تبدأ بعد في اكتساب النقاط! العب بعض الألعاب أولاً.')], flags: 64 });
        return;
      }

      const total = userPoint.total;
      let currentLevel = levels[0];
      let nextLevel = levels[1];
      for (let i = 0; i < levels.length; i++) {
        if (total >= levels[i].minPoints) currentLevel = levels[i];
        if (i < levels.length - 1) nextLevel = levels[i + 1];
      }
      const pointsToNext = nextLevel.minPoints - total;
      const prevThreshold = currentLevel.minPoints;
      const progress = total - prevThreshold;
      const range = nextLevel.minPoints - prevThreshold;

      const progressBarStr = '🟠'.repeat(Math.min(Math.round((progress / range) * 12), 12)) + '⚪'.repeat(Math.max(12 - Math.min(Math.round((progress / range) * 12), 12), 0));

      const gameScores = await prisma.gameScore.findMany({ where: { userId }, orderBy: { id: 'desc' }, take: 10 });
      const totalCorrect = gameScores.reduce((s, g) => s + g.correct, 0);
      const totalWrong = gameScores.reduce((s, g) => s + g.wrong, 0);
      const totalGamesAll = await prisma.gameScore.count({ where: { userId } });

      const gameTypeNames: Record<string, string> = {
        'quran-quiz': '📖 مسابقة قرآن',
        'who-am-i': '🕋 من أنا',
        'complete-ayah': '📜 أكمل الآية',
        'islamic-test': '📝 اختبار ديني',
      };

      const recentGames = gameScores.slice(0, 5).map(g => {
        const name = gameTypeNames[g.gameType] || g.gameType;
        return `${name}: ${g.score} نقطة (${g.correct}/${g.correct + g.wrong})`;
      });

      const embed = buildEmbed('games', {
        author: 'ملفي الشخصي',
        title: `🎯 ${interaction.user.username}`,
        fields: [
          { name: bold('الإجمالي'), value: `**${total}** نقطة`, inline: false },
          { name: bold('المستوى'), value: currentLevel.name, inline: true },
          { name: bold('التالي'), value: `${nextLevel.name} (يبقى ${pointsToNext})`, inline: true },
          { name: bold('التقدم'), value: `\`${progressBarStr}\`\n${progress}/${range}`, inline: false },
          { name: bold('نقاط الألعاب'), value: `${userPoint.gamePts}`, inline: true },
          { name: bold('نقاط المسابقات'), value: `${userPoint.quizPts}`, inline: true },
          { name: bold('عدد الألعاب'), value: `${totalGamesAll}`, inline: true },
          { name: bold('صحيحة'), value: `${totalCorrect}`, inline: true },
          { name: bold('خاطئة'), value: `${totalWrong}`, inline: true },
          ...(recentGames.length > 0 ? [{ name: bold('آخر النتائج'), value: recentGames.join('\n') }] : []),
        ],
      });

      await interaction.reply({ embeds: [embed] });
    } else if (sub === 'لوحة-الشرف') {
      const topUsers = await prisma.userPoint.findMany({
        orderBy: { total: 'desc' },
        take: 10,
        include: { user: true },
      });

      if (topUsers.length === 0) {
        await interaction.reply({ embeds: [errorEmbed('لا توجد نتائج بعد! ابدأ باللعب لكي تظهر في اللوحة.')], flags: 64 });
        return;
      }

      const medals = ['🥇', '🥈', '🥉'];
      const levelEmojis: Record<string, string> = {
        'طالب علم': '📖', 'مثقف': '📚', 'عالم': '🔬', 'شيخ': '👳', 'قدوة': '🌟',
      };

      const entries = topUsers.map((u, i) => {
        const medal = medals[i] || `${i + 1}.`;
        const lv = levels.slice().reverse().find(l => u.total >= l.minPoints) || levels[0];
        const emoji = levelEmojis[lv.name] || '📖';
        return `${medal} **${u.user.username}** — ${u.total} نقطة ${emoji} ${lv.name}`;
      });

      const embed = buildEmbed('games', {
        author: 'لوحة الشرف',
        title: '🎯 المتصدرون',
        description: entries.join('\n'),
        fields: [
          { name: bold('المشاركون'), value: `${topUsers.length}+`, inline: true },
          { name: bold('أعلى نقاط'), value: `${topUsers[0].total}`, inline: true },
        ],
        footer: 'تابع اللعب لترتفع في الترتيب',
      });

      await interaction.reply({ embeds: [embed] });
    }
  },
  category: 'games',
} as Command;
