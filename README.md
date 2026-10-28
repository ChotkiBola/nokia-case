# Nokia case study: interaktiv taqdimot

TDIU, MBA-15. «Tadbirkorlik va innovatsiyalar» fanidan case study.

## Nimalar bor

- 21 ta keynote uslubidagi slayd: oq (yuksalish), qora (inqiroz), Nokia ko‘k (qayta tug‘ilish).
- Bosh sahifada aylanib turadigan 3D telefon, kinematografik o‘tishlar, animatsiyali raqamlar va grafiklar.
- **Auditoriya bilan ishlash:** guruhdoshlar QR-kodni skanerlab `/join` sahifasini ochadi.
  - 👏 🔥 😮 😂 ❤️ 🤯 reaksiyalari katta ekranda uchib chiqadi.
  - Ikkita so‘z buluti: javoblar ekranda jonli yig‘iladi.
  - Ikkita jonli ovoz berish.
  - Telefondagi sahifa siz ko‘rsatayotgan slaydga o‘zi ergashadi.
- Finalda Snake «E’tiboringiz uchun rahmat!» yozuvini chizadi va bosilgan reaksiyalar soni chiqadi.

## Taqdimot kuni

1. Kompyuterda saytni **`https://SAYTINGIZ/?host`** manzili bilan oching. Yuqorida «Boshqaruvchi ekran» yozuvi chiqadi. Faqat shu ekran telefonlarni boshqaradi, bu sozlama brauzerda saqlanib qoladi.
2. «Taqdimot rejimi» tugmasini yoki `P` harfini bosing.
3. Ikkinchi slaydda katta QR-kod chiqadi, guruhdoshlar shu yerda qo‘shiladi. Keyingi slaydlarda kichik QR burchakda turadi.
4. So‘z bulutida nojo‘ya so‘z chiqsa, boshqaruvchi ekranda uni **ikki marta bosing**, u o‘chadi.

| Tugma | Vazifasi |
|---|---|
| `→`, `Space`, `PageDown` | Keyingi slayd |
| `←`, `PageUp` | Oldingi slayd |
| `Home` / `End` | Birinchi / oxirgi slayd |
| `Esc` | Taqdimotdan chiqish (o‘yin paytida o‘yinni to‘xtatadi) |

## Ovozlarni nolga tushirish

Vercel → Settings → Environment Variables bo‘limiga `HOST_KEY` qo‘shing (istalgan maxfiy so‘z) va Redeploy qiling. Keyin:

- saytni `https://SAYTINGIZ/?host=MAXFIY_SOZ` bilan oching;
- tozalash uchun brauzer konsolida: `fetch("/api/host",{method:"POST",body:JSON.stringify({a:"reset",key:"MAXFIY_SOZ"})})`.

`HOST_KEY` qo‘yilsa, kalitni bilmagan odam telefonlarni boshqara olmaydi.

## Texnik qism

- Statik sayt + Vercel serverless funksiyalari (`api/`), ma’lumotlar Upstash Redis’da (bepul tarif).
- `api/live.js`: ekran va telefonlar uchun holat, reaksiyalar, so‘zlar, ovozlar.
- `api/act.js`: telefondan reaksiya, so‘z va ovoz qabul qiladi.
- `api/host.js`: boshqaruvchi buyruqlari (slayd holati, so‘zni yashirish, tozalash).
- GSAP, three.js, shriftlar va QR kutubxonasi `assets/` ichida, CDN kerak emas.
