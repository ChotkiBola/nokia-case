# Nokia case study: interaktiv taqdimot sayti

TDIU, MBA-15. «Tadbirkorlik va innovatsiyalar» fanidan case study.

## Nimalar bor

- Scroll bilan ochiladigan landing sahifa. Undagi «Taqdimot rejimi» slaydlarni to‘liq ekranda ko‘rsatadi.
- Vaqt chizig‘i, animatsiyali grafiklar, «2011-yilda nima qilardingiz?» simulyatsiyasi.
- QR-kod orqali jonli ovoz berish. Guruhdoshlar telefondan ovoz beradi, natija ekranda yangilanib turadi.
- Oxirgi slaydda Snake «E’tiboringiz uchun rahmat!» yozuvini chizadi, keyin uni o‘ynasa bo‘ladi.

## Vercel’ga joylash (10 daqiqa)

1. **GitHub.** Yangi repozitoriy oching (masalan, `nokia-case`). Arxivni ochib, ichidagi hamma fayl va papkalarni repoga yuklang. `index.html` repo ildizida turishi kerak.
2. **Vercel.** vercel.com → *Add New → Project* → repozitoriyni tanlab *Import* bosing. Framework: *Other*, boshqa sozlamalarga tegmang → *Deploy*.
3. **Ovoz berish bazasi (bepul).** Vercel’da loyihani oching → *Storage* → *Create Database* → **Upstash for Redis** → *Free* tarif → loyihaga ulang (*Connect*). Kerakli kalitlar (`KV_REST_API_URL`, `KV_REST_API_TOKEN`) avtomatik qo‘shiladi.
4. **Qayta deploy.** *Deployments* → oxirgi deploy → *⋯ → Redeploy*. Shundan keyin ovoz berish ishlaydi.
5. **(Ixtiyoriy) Ovozlarni nolga tushirish.** *Settings → Environment Variables* ga `RESET_KEY` qo‘shing (istalgan maxfiy so‘z) va qayta deploy qiling. Taqdimotdan oldin `https://SAYTINGIZ/api/reset?key=MAXFIY_SOZ` manzilini oching.

QR-kod saytning manzilini avtomatik oladi, uni qo‘lda o‘zgartirish shart emas.

## Taqdimot paytida boshqarish

| Tugma | Vazifasi |
|---|---|
| `P` yoki «Taqdimot rejimi» | Slaydlarni to‘liq ekranda boshlash |
| `→`, `Space`, `PageDown` | Keyingi slayd |
| `←`, `PageUp` | Oldingi slayd |
| `Home` / `End` | Birinchi / oxirgi slayd |
| `Esc` | Taqdimotdan chiqish (o‘yin paytida o‘yinni to‘xtatadi) |

Telefon yoki planshetda slaydlar barmoq bilan surib almashtiriladi.

## Fayllar

```
index.html          asosiy sahifa
vote.html           telefondan ovoz berish sahifasi (/vote)
assets/             dizayn, skriptlar, shriftlar (internetsiz ham ishlaydi)
api/vote.js         ovozni saqlash
api/results.js      natijalarni olish
api/reset.js        ovozlarni o‘chirish (RESET_KEY bilan)
```
