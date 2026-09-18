import type { Metadata } from "next";
import { Footer, Header } from "@/components/site-chrome";

export const metadata: Metadata = {
  title: "Maxfiylik siyosati",
  description:
    "Cardrive.uz foydalanuvchilarining shaxsiy ma’lumotlarini yig’ish, foydalanish, saqlash va o’chirish tartibi.",
  alternates: { canonical: "/privacy" },
};

const telegramUrl = "https://t.me/CarDriveUzBot";

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="bg-slate-50">
        <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
            <p className="text-sm font-semibold text-blue-600">Cardrive.uz</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Maxfiylik siyosati
            </h1>
            <p className="mt-3 text-sm text-slate-500">
              Oxirgi yangilanish: 18 sentabr 2026
            </p>

            <div className="mt-10 space-y-8 text-[15px] leading-7 text-slate-700">
              <section>
                <h2 className="text-xl font-bold text-slate-950">1. Umumiy ma’lumot</h2>
                <p className="mt-3">
                  Ushbu Maxfiylik siyosati Cardrive.uz veb-sayti va uning PWA/mobil ilovasi
                  (keyingi o‘rinlarda — “Cardrive”) orqali foydalanuvchilarning shaxsiy
                  ma’lumotlari qanday yig‘ilishi, ishlatilishi, saqlanishi va ulashilishini
                  tushuntiradi. Cardrive yangi avtomobillarni ko‘rish, avtomobil tanlash,
                  buyurtma berish hamda mavjud kredit va muddatli to‘lov dasturlari haqida
                  ma’lumot olish imkonini beradi.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-950">2. Biz qanday ma’lumotlarni yig‘amiz?</h2>
                <ul className="mt-3 list-disc space-y-2 pl-6">
                  <li><strong>Telefon raqami</strong> — akkauntni yaratish va SMS/OTP orqali tasdiqlash uchun.</li>
                  <li><strong>Ism va familiya</strong> — foydalanuvchi profilini yaratish uchun.</li>
                  <li><strong>Buyurtma ma’lumotlari</strong> — tanlangan avtomobil, buyurtma turi, narxi, valyutasi, buyurtma holati va foydalanuvchi yuborgan izohlar.</li>
                  <li><strong>Moliyalashtirish ma’lumotlari</strong> — tanlangan bank/kredit dasturi va kredit arizasi holati. Bankka ariza yuborish foydalanuvchi tomonidan tasdiqlanganidan keyin amalga oshiriladi.</li>
                  <li><strong>Texnik va sessiya ma’lumotlari</strong> — xizmatni ishlatish uchun zarur bo‘lgan texnik ma’lumotlar va autentifikatsiya sessiyasi. Cardrive foydalanuvchi sessiyasi uchun HTTP-only cookie’dan foydalanadi.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-950">3. Ma’lumotlardan qanday foydalanamiz?</h2>
                <ul className="mt-3 list-disc space-y-2 pl-6">
                  <li>foydalanuvchini autentifikatsiya qilish va akkauntni boshqarish;</li>
                  <li>avtomobil buyurtmalarini yaratish, ko‘rsatish va bajarilishini boshqarish;</li>
                  <li>kredit yoki muddatli to‘lov bo‘yicha foydalanuvchi tanlagan xizmatni taqdim etish;</li>
                  <li>buyurtma va kredit arizasi holati haqida xabar yuborish;</li>
                  <li>Cardrive xavfsizligi, barqarorligi va funksiyalarini yaxshilash;</li>
                  <li>qonuniy majburiyatlarni bajarish va firibgarlikning oldini olish.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-950">4. Ma’lumotlar kim bilan ulashilishi mumkin?</h2>
                <p className="mt-3">
                  Cardrive shaxsiy ma’lumotlarni sotmaydi. Ma’lumotlar faqat xizmatni
                  ko‘rsatish uchun zarur bo‘lgan doirada quyidagi toifalar bilan ulashilishi
                  mumkin:
                </p>
                <ul className="mt-3 list-disc space-y-2 pl-6">
                  <li>Cardrive infratuzilmasini ta’minlovchi texnologik xizmatlar, jumladan ma’lumotlar bazasi va hosting provayderlari;</li>
                  <li>SMS/OTP xabarlarini yetkazib beruvchi xizmatlar;</li>
                  <li>foydalanuvchi kredit arizasini yuborishni tanlagan bank yoki moliyaviy hamkor;</li>
                  <li>qonuniy talab mavjud bo‘lganda vakolatli davlat organlari.</li>
                </ul>
                <p className="mt-3">
                  Kredit arizasi bankka faqat foydalanuvchi tegishli rozilikni tasdiqlaganidan
                  keyin yuboriladi. Bank tomonidan ma’lumotlarga ishlov berish tegishli bankning
                  o‘z maxfiylik siyosati va amaldagi qonunchilikka ham bo‘ysunadi.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-950">5. Uchinchi tomon xizmatlari</h2>
                <p className="mt-3">
                  Cardrive xizmatni ishlatish uchun ayrim uchinchi tomon texnologiyalaridan
                  foydalanishi mumkin. Masalan, qo‘llab-quvvatlash chat vidjeti Jivo xizmatidan
                  foydalanadi. Bunday xizmatlarning ma’lumotlarga ishlovi ularning tegishli
                  maxfiylik siyosatlari bilan ham tartibga solinadi.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-950">6. Cookies va sessiya</h2>
                <p className="mt-3">
                  Cardrive akkaunt sessiyasini saqlash uchun texnik cookie’dan foydalanadi.
                  U foydalanuvchini autentifikatsiya qilish va akkauntga tegishli sahifalarni
                  himoyalash uchun ishlatiladi. Sessiya cookie’si JavaScript orqali o‘qilishini
                  cheklovchi HTTP-only parametriga ega va ishlab chiqarish muhitida xavfsiz
                  uzatish uchun Secure parametridan foydalanadi.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-950">7. Ma’lumotlarni himoyalash</h2>
                <p className="mt-3">
                  Cardrive ma’lumotlarni ruxsatsiz kirish, o‘zgartirish yoki yo‘qotishdan
                  himoyalash uchun texnik va tashkiliy choralarni qo‘llaydi. Ma’lumotlar
                  uzatilishi HTTPS kabi zamonaviy transport xavfsizligi mexanizmlari orqali
                  amalga oshiriladi. Maxfiy xizmat kalitlari mijoz qurilmasiga yuborilmaydi.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-950">8. Ma’lumotlarni saqlash va o‘chirish</h2>
                <p className="mt-3">
                  Ma’lumotlar xizmatni ko‘rsatish uchun zarur bo‘lgan muddat davomida saqlanadi.
                  Foydalanuvchi akkaunti va unga tegishli shaxsiy ma’lumotlarni o‘chirishni
                  so‘rashi mumkin. Qonun bo‘yicha saqlanishi shart bo‘lgan ma’lumotlar bundan
                  mustasno bo‘lishi mumkin.
                </p>
                <div className="mt-4 rounded-2xl bg-slate-50 p-5">
                  <p className="font-semibold text-slate-950">Akkaunt va ma’lumotlarni o‘chirish so‘rovi</p>
                  <p className="mt-2">
                    O‘chirish so‘rovini Cardrive rasmiy Telegram botiga yuboring:
                  </p>
                  <a
                    href={telegramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex rounded-full bg-slate-950 px-5 py-2.5 font-bold text-white hover:bg-slate-800"
                  >
                    @CarDriveUzBot orqali so‘rov yuborish
                  </a>
                  <p className="mt-3 text-sm text-slate-500">
                    So‘rovni qayta ishlashdan oldin akkaunt egasi ekaningizni tasdiqlash
                    so‘ralishi mumkin.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-950">9. Bolalar maxfiyligi</h2>
                <p className="mt-3">
                  Cardrive bolalar uchun mo‘ljallanmagan. Biz bolalardan ataylab shaxsiy
                  ma’lumot yig‘ishni maqsad qilmaymiz.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-950">10. Siyosatdagi o‘zgarishlar</h2>
                <p className="mt-3">
                  Xizmatlarimiz yoki qonunchilikdagi o‘zgarishlar sababli ushbu siyosat
                  yangilanishi mumkin. Yangilangan versiya shu sahifada e’lon qilinadi va
                  “Oxirgi yangilanish” sanasi o‘zgartiriladi.
                </p>
              </section>

              <section id="contact">
                <h2 className="text-xl font-bold text-slate-950">11. Aloqa</h2>
                <p className="mt-3">
                  Maxfiylik, ma’lumotlardan foydalanish yoki akkauntni o‘chirish bo‘yicha
                  savollar uchun Cardrive rasmiy Telegram botiga murojaat qiling:
                </p>
                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-block font-bold text-blue-600 hover:underline"
                >
                  https://t.me/CarDriveUzBot
                </a>
              </section>

              <hr className="border-slate-200" />

              <section>
                <h2 className="text-xl font-bold text-slate-950">Русская версия</h2>

                <h3 className="mt-6 text-lg font-bold text-slate-950">Политика конфиденциальности Cardrive.uz</h3>
                <p className="mt-2">
                  Эта политика описывает, как Cardrive.uz обрабатывает персональные данные
                  пользователей сайта и PWA/мобильного приложения Cardrive.
                </p>

                <h3 className="mt-6 text-lg font-bold text-slate-950">Какие данные мы обрабатываем</h3>
                <ul className="mt-2 list-disc space-y-2 pl-6">
                  <li>номер телефона для регистрации и подтверждения по SMS/OTP;</li>
                  <li>имя и фамилию для профиля пользователя;</li>
                  <li>данные заказов: автомобиль, тип покупки, стоимость, валюта, статус и комментарии;</li>
                  <li>данные кредитной заявки: выбранный банк/программа и статус заявки;</li>
                  <li>необходимые технические и сессионные данные, включая HTTP-only cookie сессии.</li>
                </ul>

                <h3 className="mt-6 text-lg font-bold text-slate-950">Использование и передача данных</h3>
                <p className="mt-2">
                  Данные используются для авторизации, обработки заказов, предоставления
                  кредитных и рассрочных сервисов, уведомлений и обеспечения безопасности.
                  Cardrive не продаёт персональные данные. В необходимых случаях данные
                  передаются технологическим провайдерам, SMS-провайдерам и выбранному
                  пользователем банку или финансовому партнёру. Передача кредитной заявки
                  выполняется после подтверждения соответствующего согласия пользователем.
                </p>

                <h3 className="mt-6 text-lg font-bold text-slate-950">Удаление аккаунта и данных</h3>
                <p className="mt-2">
                  Пользователь может запросить удаление аккаунта и связанных персональных
                  данных через официальный Telegram-бот Cardrive:
                </p>
                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block font-bold text-blue-600 hover:underline"
                >
                  @CarDriveUzBot
                </a>
                <p className="mt-2 text-sm text-slate-500">
                  В отдельных случаях данные, которые необходимо хранить по закону, могут
                  сохраняться в течение установленного законом срока.
                </p>

                <h3 className="mt-6 text-lg font-bold text-slate-950">Контакты</h3>
                <p className="mt-2">
                  По вопросам конфиденциальности, обработки или удаления данных обращайтесь
                  через официальный Telegram-бот Cardrive:
                </p>
                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block font-bold text-blue-600 hover:underline"
                >
                  https://t.me/CarDriveUzBot
                </a>
              </section>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
