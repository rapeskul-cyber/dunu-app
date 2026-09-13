// =============================================================================
// SEED DATA — Doa & Zikir autentik
// Sumber: Al-Qur’an, Shahih Bukhari, Shahih Muslim, Sunan Abu Dawud,
//         Sunan At-Tirmidzi, Hisnul Muslim (Sa'id bin Ali bin Wahf Al-Qahthani)
// Teks Arab: berharakat lengkap. Transliterasi: Latin standar Indonesia.
// =============================================================================

export interface SeedCategory {
  id: number;
  name: string;
  slug: string;
  icon: string;
  color: string;
}

export interface SeedDua {
  id: number;
  category_slug: string;
  title: string;
  arabic: string;
  latin: string;
  translation: string;
  benefit: string;
  source: string;
  hadith_grade: 'Shahih' | 'Hasan' | 'Hasan Shahih' | 'Mutawatir';
  audio_url: string;
  default_target: number;
}

export const CATEGORIES: SeedCategory[] = [
  { id: 1, name: 'Zikir Pagi', slug: 'dzikir-pagi', icon: 'sunrise', color: '#F59E0B' },
  { id: 2, name: 'Zikir Petang', slug: 'dzikir-petang', icon: 'sunset', color: '#8B5CF6' },
  { id: 3, name: 'Setelah Sholat', slug: 'setelah-sholat', icon: 'mosque', color: '#10B981' },
  { id: 4, name: 'Sebelum Tidur', slug: 'sebelum-tidur', icon: 'moon', color: '#3B82F6' },
  { id: 5, name: 'Perlindungan', slug: 'perlindungan', icon: 'shield', color: '#EF4444' },
  { id: 6, name: 'Rezeki & Hajat', slug: 'rezeki-hajat', icon: 'seed', color: '#14B8A6' },
];

export const DUAS: SeedDua[] = [
  // ---------------------------------------------------------------- ZIKIR PAGI
  {
    id: 1,
    category_slug: 'dzikir-pagi',
    title: 'Sayyidul Istighfar',
    arabic:
      'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
    latin:
      'Allāhumma anta rabbī lā ilāha illā anta, khalaqtanī wa anā ‘abduka, wa anā ‘alā ‘ahdika wa wa‘dika mastatha‘tun, a‘ūdzu bika min syarri mā shana‘tun, abū’u laka bini‘matika ‘alayya, wa abū’u biżanbī faghfir lī fa’innahu lā yaghfiruż-żunūba illā anta.',
    translation:
      'Ya Allah, Engkau adalah Tuhanku, tidak ada tuhan yang berhak disembah selain Engkau. Engkau telah menciptakanku dan aku adalah hamba-Mu. Aku menetapi perjanjian-Mu dan janji-Mu sesuai kemampuanku. Aku berlindung kepada-Mu dari keburukan perbuatanku. Aku mengakui nikmat-Mu kepadaku dan aku mengakui dosaku, maka ampunilah aku. Sebab tidak ada yang dapat mengampuni dosa selain Engkau.',
    benefit:
      'Barangsiapa mengucapkannya di waktu pagi dengan yakin lalu meninggal pada hari itu sebelum petang, ia termasuk penghuni surga. (HR. Bukhari no. 6306)',
    source: 'HR. Bukhari no. 6306',
    hadith_grade: 'Shahih',
    audio_url: '',
    default_target: 1,
  },
  {
    id: 2,
    category_slug: 'dzikir-pagi',
    title: 'Ayat Kursi',
    arabic:
      'اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ وَلَا يَئُودُهُ حِفْظُهُمَا وَهُوَ الْعَلِيُّ الْعَظِيمُ',
    latin:
      'Allāhu lā ilāha illā huwal-ḥayyul-qayyūm, lā ta’khudzuhū sinatuw wa lā naum, lahū mā fis-samāwāti wa mā fil-arḍ, man żalladzī yasyfa‘u ‘indahū illā bi’iżnih, ya‘lamu mā baina aidīhim wa mā khalfahum, wa lā yuḥīṭūna bisyai’im min ‘ilmihī illā bimā syā’, wasi‘a kursiyyuhus-samāwāti wal-arḍ, wa lā ya’ūduhū ḥifẓuhumā wa huwal-‘aliyyul-‘aẓīm.',
    translation:
      'Allah, tidak ada tuhan selain Dia, Yang Mahahidup lagi terus-menerus mengurus makhluk-Nya. Dia tidak mengantuk dan tidak tidur. Milik-Nya apa yang ada di langit dan di bumi. Tidak ada yang dapat memberi syafaat di sisi-Nya tanpa izin-Nya. Dia mengetahui apa yang di hadapan mereka dan apa yang di belakang mereka, dan mereka tidak mengetahui sesuatu apa pun dari ilmu-Nya melainkan apa yang Dia kehendaki. Kursi-Nya meliputi langit dan bumi. Dia tidak merasa berat memelihara keduanya, dan Dia Mahatinggi lagi Mahabesar.',
    benefit:
      'Barangsiapa membacanya di waktu pagi, niscaya ia terlindungi dari jin hingga waktu petang. (HR. An-Nasa’i dalam Amalul Yaum wal Lailah)',
    source: 'QS. Al-Baqarah [2]: 255; HR. An-Nasa’i',
    hadith_grade: 'Shahih',
    audio_url: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/262.mp3',
    default_target: 1,
  },
  {
    id: 3,
    category_slug: 'dzikir-pagi',
    title: 'Taubat & Mohon Rahmat (Ia’tiradh)',
    arabic:
      'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذَا الْيَوْمِ وَخَيْرَ مَا بَعْدَهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذَا الْيَوْمِ وَشَرِّ مَا بَعْدَهُ',
    latin:
      'Aṣbaḥnā wa aṣbaḥal-mulku lillāh, wal-ḥamdu lillāh, lā ilāha illallāhu waḥdahū lā syarīka lah, lahul-mulku wa lahul-ḥamdu wa huwa ‘alā kulli syai’in qadīr. Rabbi as’aluka khaira mā fā hāżal-yaumi wa khaira mā ba‘dah, wa a‘ūdzu bika min syarri mā fī hāżal-yaumi wa syarri mā ba‘dah.',
    translation:
      'Kami telah memasuki waktu pagi dan kerajaan hanya milik Allah. Segala puji bagi Allah. Tidak ada tuhan selain Allah Yang Maha Esa, tidak ada sekutu bagi-Nya. Milik-Nya kerajaan dan bagi-Nya segala pujian, dan Dia Mahakuasa atas segala sesuatu. Ya Tuhanku, aku memohon kepada-Mu kebaikan hari ini dan kebaikan setelahnya, dan aku berlindung kepada-Mu dari keburukan hari ini dan keburukan setelahnya.',
    benefit: 'Zikir pembuka pagi untuk memohon kebaikan dan perlindungan dari keburukan sepanjang hari. (HR. Muslim no. 4865)',
    source: 'HR. Muslim no. 4865; Abu Dawud no. 5084',
    hadith_grade: 'Shahih',
    audio_url: '',
    default_target: 1,
  },
  {
    id: 4,
    category_slug: 'dzikir-pagi',
    title: 'Bismillah Pelindung',
    arabic:
      'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
    latin:
      'Bismillāhilladzī lā yaḍurru ma‘as-mihī syai’un fil-arḍi wa lā fis-samā’i wa huwas-samī‘ul-‘alīm.',
    translation:
      'Dengan nama Allah yang apabila disebut, tiada sesuatu pun yang membahayakan di bumi maupun di langit. Dan Dia Maha Mendagi lagi Maha Mengetahui.',
    benefit:
      'Barangsiapa mengucapkannya tiga kali di waktu pagi dan tiga kali di waktu petang, maka tidak ada sesuatu pun yang membahayakannya. (HR. Abu Dawud & At-Tirmidzi)',
    source: 'HR. Abu Dawud no. 5088; At-Tirmidzi no. 3388',
    hadith_grade: 'Hasan Shahih',
    audio_url: '',
    default_target: 3,
  },
  {
    id: 5,
    category_slug: 'dzikir-pagi',
    title: 'Rida Allah sebagai Tuhan',
    arabic:
      'رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا',
    latin:
      'Raḍītu billāhi rabban, wa bil-islāmi dīnan, wa bi-muḥammadin (ṣallallāhu ‘alaihi wa sallama) nabiyyā.',
    translation:
      'Aku ridha Allah sebagai Tuhanku, Islam sebagai agamaku, dan Muhammad ﷺ sebagai nabiku.',
    benefit:
      'Barangsiapa mengucapkannya tiga kali di waktu pagi dan petang, maka hak atas Allah untuk memberinya ridha pada hari kiamat. (HR. Abu Dawud & At-Tirmidzi)',
    source: 'HR. Abu Dawud no. 5072; At-Tirmidzi no. 3389',
    hadith_grade: 'Hasan Shahih',
    audio_url: '',
    default_target: 3,
  },

  // --------------------------------------------------------------- ZIKIR PETANG
  {
    id: 6,
    category_slug: 'dzikir-petang',
    title: 'Sayyidul Istighfar (Petang)',
    arabic:
      'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
    latin:
      'Allāhumma anta rabbī lā ilāha illā anta, khalaqtanī wa anā ‘abduka, wa anā ‘alā ‘ahdika wa wa‘dika mastatha‘tun, a‘ūdzu bika min syarri mā shana‘tun, abū’u laka bini‘matika ‘alayya, wa abū’u biżanbī faghfir lī fa’innahu lā yaghfiruż-żunūba illā anta.',
    translation:
      'Ya Allah, Engkau adalah Tuhanku, tidak ada tuhan yang berhak disembah selain Engkau. Engkau menciptakanku dan aku hamba-Mu. Aku menetapi perjanjian-Mu semampuku. Aku berlindung dari keburukan perbuatanku. Aku mengakui nikmat-Mu dan dosaku, maka ampunilah aku; sungguh tiada yang mengampuni dosa selain Engkau.',
    benefit:
      'Dibaca di waktu petang; jika meninggal pada malam itu sebelum pagi, ia termasuk penghuni surga. (HR. Bukhari no. 6306)',
    source: 'HR. Bukhari no. 6306',
    hadith_grade: 'Shahih',
    audio_url: '',
    default_target: 1,
  },
  {
    id: 7,
    category_slug: 'dzikir-petang',
    title: 'Memasuki Waktu Petang',
    arabic:
      'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذِهِ اللَّيْلَةِ وَخَيْرَ مَا بَعْدَهَا',
    latin:
      'Amsainā wa amsal-mulku lillāh, wal-ḥamdu lillāh, lā ilāha illallāhu waḥdahū lā syarīka lah, lahul-mulku wa lahul-ḥamdu wa huwa ‘alā kulli syai’in qadīr. Rabbi as’aluka khaira mā fā hāżihil-lailati wa khaira mā ba‘dahā.',
    translation:
      'Kami telah memasuki waktu petang dan kerajaan hanya milik Allah. Segala puji bagi Allah. Tidak ada tuhan selain Allah Yang Maha Esa, tiada sekutu bagi-Nya. Milik-Nya kerajaan dan bagi-Nya pujian, Dia Mahakuasa atas segala sesuatu. Ya Tuhanku, aku memohon kebaikan malam ini dan kebaikan setelahnya.',
    benefit: 'Zikir pembuka petang; kebalikan dari zikir pagi. (HR. Muslim no. 4865)',
    source: 'HR. Muslim no. 4865',
    hadith_grade: 'Shahih',
    audio_url: '',
    default_target: 1,
  },
  {
    id: 8,
    category_slug: 'dzikir-petang',
    title: 'Perlindungan dari Siksa',
    arabic:
      'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
    latin: 'A‘ūdzu bikalimātillāhit-tāmmāti min syarri mā khalaq.',
    translation:
      'Aku berlindung dengan kalimat-kalimat Allah yang sempurna dari keburukan makhluk yang Dia ciptakan.',
    benefit:
      'Barangsiapa mengucapkannya tiga kali di waktu petang, maka tidak ada sesuatu yang membahayakannya malam itu. (HR. Muslim no. 2708)',
    source: 'HR. Muslim no. 2708',
    hadith_grade: 'Shahih',
    audio_url: '',
    default_target: 3,
  },
  {
    id: 9,
    category_slug: 'dzikir-petang',
    title: 'Cukuplah Allah Pelindungku',
    arabic: 'حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ',
    latin:
      'Ḥasbiyallāhu lā ilāha illā huwa ‘alaihi tawakkaltu wa huwa rabbul-‘arsyil-‘aẓīm.',
    translation:
      'Cukuplah Allah bagiku; tidak ada tuhan selain Dia. Hanya kepada-Nya aku bertawakal, dan Dia adalah Tuhan pemilik ‘Arsy yang agung.',
    benefit:
      'Barangsiapa mengucapkannya tujuh kali pagi dan petang, Allah akan mencukupinya dari segala kepedihan dunia dan akhirat. (HR. Abu Dawud & At-Tirmidzi)',
    source: 'HR. Abu Dawud no. 5080; At-Tirmidzi no. 3575',
    hadith_grade: 'Hasan',
    audio_url: '',
    default_target: 7,
  },
  {
    id: 10,
    category_slug: 'dzikir-petang',
    title: 'Pembersih Hati (Tasbih)',
    arabic:
      'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ عَدَدَ خَلْقِهِ، وَرِضَا نَفْسِهِ، وَزِنَةَ عَرْشِهِ، وَمِدَادَ كَلِمَاتِهِ',
    latin:
      'Subḥānallāhi wa biḥamdihī ‘adada khalaqihī, wa riiḍā nafsihī, wa zinata ‘arsyihī, wa midāda kalimātih.',
    translation:
      'Maha Suci Allah dan segala puji bagi-Nya, sebanyak bilangan makhluk-Nya, sesuai keridaan diri-Nya, seberat timbangan ‘Arsy-Nya, dan seukuran tinta untuk kalimat-kalimat-Nya.',
    benefit:
      'Zikir yang pahalanya tidak dapat dihitung dan tidak dapat ditandingi oleh apa pun. (HR. Muslim no. 4866)',
    source: 'HR. Muslim no. 4866',
    hadith_grade: 'Shahih',
    audio_url: '',
    default_target: 3,
  },

  // ---------------------------------------------------------- SETELAH SHOLAT
  {
    id: 11,
    category_slug: 'setelah-sholat',
    title: 'Istighfar Setelah Sholat',
    arabic: 'أَسْتَغْفِرُ اللَّهَ',
    latin: 'Astaghfirullāh.',
    translation: 'Aku memohon ampun kepada Allah.',
    benefit:
      'Dibaca tiga kali setelah setiap sholat fardhu sebelum melanjutkan zikir. (HR. Muslim no. 591)',
    source: 'HR. Muslim no. 591',
    hadith_grade: 'Shahih',
    audio_url: '',
    default_target: 3,
  },
  {
    id: 12,
    category_slug: 'setelah-sholat',
    title: 'Allahumma Antas-Salam',
    arabic:
      'اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
    latin:
      'Allāhumma antas-salāmu wa minkas-salām, tabārakta yā żal-jalāli wal-ikrām.',
    translation:
      'Ya Allah, Engkau Pemberi keselamatan dan dari-Mulah keselamatan. Maha Suci Engkau, wahai Tuhan pemilik keagungan dan kemuliaan.',
    benefit: 'Penutup sholat yang diajarkan Nabi ﷺ kepada seluruh umatnya. (HR. Muslim no. 591)',
    source: 'HR. Muslim no. 591',
    hadith_grade: 'Shahih',
    audio_url: '',
    default_target: 1,
  },
  {
    id: 13,
    category_slug: 'setelah-sholat',
    title: 'Tasbih Tahmid Takbir',
    arabic:
      'سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَاللَّهُ أَكْبَرُ',
    latin: 'Subḥānallāh, wal-ḥamdu lillāh, wallāhu akbar.',
    translation: 'Maha Suci Allah, segala puji bagi Allah, dan Allah Mahabesar.',
    benefit:
      'Dibaca 33x setelah sholat. Barangsiapa melakukannya, diampuni kesalahannya meski sebanyak buih di lautan. (HR. Muslim no. 595)',
    source: 'HR. Muslim no. 595',
    hadith_grade: 'Shahih',
    audio_url: '',
    default_target: 33,
  },
  {
    id: 14,
    category_slug: 'setelah-sholat',
    title: 'Penutup Tasbih (Laa ilaha illallah)',
    arabic:
      'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
    latin:
      'Lā ilāha illallāhu waḥdahū lā syarīka lah, lahul-mulku wa lahul-ḥamdu wa huwa ‘alā kulli syai’in qadīr.',
    translation:
      'Tidak ada tuhan selain Allah Yang Maha Esa, tiada sekutu bagi-Nya. Milik-Nya kerajaan dan bagi-Nya segala pujian, dan Dia Mahakuasa atas segala sesuatu.',
    benefit:
      'Menyempurnakan hitungan 100 setelah setiap sholat; pengamalan yang menjaga consistency ibadah harian. (HR. Muslim no. 597)',
    source: 'HR. Muslim no. 597',
    hadith_grade: 'Shahih',
    audio_url: '',
    default_target: 10,
  },
  {
    id: 15,
    category_slug: 'setelah-sholat',
    title: 'Sayyidul Istighfar (Setelah Sholat)',
    arabic:
      'اللَّهُمَّ إِنِّي ظَلَمْتُ نَفْسِي ظُلْمًا كَثِيرًا وَلَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ، فَاغْفِرْ لِي مَغْفِرَةً مِنْ عِنْدِكَ وَارْحَمْنِي إِنَّكَ أَنْتَ الْغَفُورُ الرَّحِيمُ',
    latin:
      'Allāhumma innī ẓalamtu nafsī ẓulman kaṡīran wa lā yaghfiruż-żunūba illā anta, faghfir lī maghfiratan min ‘indika war-ḥamnī innaka antal-ghafūrur-raḥīm.',
    translation:
      'Ya Allah, sungguh aku telah menzalimi diriku sendiri dengan kezaliman yang banyak, dan tidak ada yang dapat mengampuni dosa kecuali Engkau. Maka ampunilah aku dengan ampunan dari-Mu dan rahmatilah aku; sungguh Engkau Yang Maha Pengampun lagi Maha Penyayang.',
    benefit: 'Doa pengakuan dosa dan permohonan ampunan, dibaca setelah sholat. (HR. Bukhari & Muslim)',
    source: 'HR. Bukhari no. 834; Muslim no. 2705',
    hadith_grade: 'Shahih',
    audio_url: '',
    default_target: 1,
  },

  // ------------------------------------------------------------- SEBELUM TIDUR
  {
    id: 16,
    category_slug: 'sebelum-tidur',
    title: 'Doa Sebelum Tidur',
    arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
    latin: 'Bismikallāhumma amūtu wa aḥyā.',
    translation: 'Dengan nama-Mu ya Allah, aku mati dan aku hidup.',
    benefit: 'Doa penutup hari yang diajarkan Rasulullah ﷺ. (HR. Bukhari no. 7394)',
    source: 'HR. Bukhari no. 7394',
    hadith_grade: 'Shahih',
    audio_url: '',
    default_target: 1,
  },
  {
    id: 17,
    category_slug: 'sebelum-tidur',
    title: 'Tasbih Tidur (33-33-34)',
    arabic: 'سُبْحَانَ اللَّهِ (33) الْحَمْدُ لِلَّهِ (33) اللَّهُ أَكْبَرُ (34)',
    latin: 'Subḥānallāh (33x), al-ḥamdu lillāh (33x), allāhu akbar (34x).',
    translation: 'Maha Suci Allah (33), segala puji bagi Allah (33), Allah Mahabesar (34).',
    benefit:
      'Lebih baik bagimu daripada seorang pelayan; dikerjakan Fatimah binti Rasulullah ﷺ setiap hendak tidur. (HR. Bukhari no. 3705; Muslim no. 2727)',
    source: 'HR. Bukhari no. 3705',
    hadith_grade: 'Shahih',
    audio_url: '',
    default_target: 100,
  },

  // ---------------------------------------------------------- PERLINDUNGAN
  {
    id: 18,
    category_slug: 'perlindungan',
    title: 'Mu’awwidzatain (Al-Falaq)',
    arabic:
      'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ مِنْ شَرِّ مَا خَلَقَ وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ',
    latin:
      'Qul a‘ūdzu birabbil-falaq, min syarri mā khalaq, wa min syarri ghāsiqin iżā waqab, wa min syarrin-naffāṡāti fil-‘uqad, wa min syarri ḥāsidin iżā ḥasad.',
    translation:
      'Katakanlah: "Aku berlindung kepada Tuhan yang menguasai subuh, dari kejahatan makhluk yang Dia ciptakan, dari kejahatan malam apabila telah gelap, dari kejahatan tukang-tukang sihir yang meniup pada buhul-buhul, dan dari kejahatan orang yang dengki apabila dia dengki."',
    benefit: 'Diulang 3x pagi dan petang untuk perlindungan dari segala gangguan. (HR. Abu Dawud & At-Tirmidzi)',
    source: 'QS. Al-Falaq [113]; HR. At-Tirmidzi no. 3575',
    hadith_grade: 'Shahih',
    audio_url: '',
    default_target: 3,
  },
  {
    id: 19,
    category_slug: 'perlindungan',
    title: 'Al-Ikhlas (Penuh)',
    arabic:
      'قُلْ هُوَ اللَّهُ أَحَدٌ * اللَّهُ الصَّمَدُ * لَمْ يَلِدْ وَلَمْ يُولَدْ * وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ',
    latin:
      'Qul huwallāhu aḥad, allāhuṣ-ṣamad, lam yalid wa lam yūlad, wa lam yakun lahū kufuwan aḥad.',
    translation:
      'Katakanlah: "Dialah Allah Yang Maha Esa. Allah tempat meminta segala sesuatu. Allah tidak beranak dan tidak diperanakkan. Dan tidak ada sesuatu pun yang setara dengan Dia."',
    benefit: 'Menggantikan sepertiga Al-Qur’an; dibaca 3x pagi dan petang. (HR. At-Tirmidzi no. 3575)',
    source: 'QS. Al-Ikhlas [112]; HR. Abu Dawud & At-Tirmidzi',
    hadith_grade: 'Shahih',
    audio_url: '',
    default_target: 3,
  },

  // ------------------------------------------------------- REZEKI & HAJAT
  {
    id: 20,
    category_slug: 'rezeki-hajat',
    title: 'Doa Kecukupan Rezeki',
    arabic:
      'اللَّهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ، وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ',
    latin:
      'Allāhummakfinī biḥalālika ‘an ḥarāmik, wa aghninī bifaḍlika ‘amman siwāk.',
    translation:
      'Ya Allah, cukupkanlah aku dengan yang halal dari yang haram, dan kayakanlah aku dengan karunia-Mu dari selain-Mu.',
    benefit: 'Doa agar dicukupkan rezekinya dengan yang halal. (HR. At-Tirmidzi no. 3563)',
    source: 'HR. At-Tirmidzi no. 3563',
    hadith_grade: 'Hasan',
    audio_url: '',
    default_target: 1,
  },
];

export const TOTAL_DUAS = DUAS.length;
export const TOTAL_CATEGORIES = CATEGORIES.length;
