# TradeM — Auth Email Templates

Брендовані email-шаблони (тема **Industrial Excellence**, dark) для Supabase Auth.
Українською, email-safe верстка (таблиці + inline-стилі, bulletproof-кнопка, захист від інверсії кольорів у Gmail/Apple Mail/Outlook).

## Як застосувати

Шаблони листів **не зберігаються в репозиторії проєкту** і не редагуються через MCP — їх потрібно вставити вручну:

**Supabase Dashboard → Authentication → Email Templates**

Для кожного шаблону:
1. Відкрийте відповідну вкладку (Confirm signup / Reset password / …).
2. Вставте `Subject` з таблиці нижче.
3. Скопіюйте вміст відповідного `.html` файлу повністю у поле **Message body (HTML)**.
4. Save.

> ⚠️ **Кожен тип листа налаштовується окремо.** Поля Subject і Body НЕ
> синхронізуються між вкладками. Найчастіша помилка — лист реєстрації
> приходить з темою/текстом про скидання пароля: це означає, що у вкладку
> **Confirm signup** випадково вставили шаблон reset-password. Перевірте, що
> Subject і Body кожної вкладки відповідають таблиці нижче.

## Відповідність файлів і темплейтів

| Файл | Вкладка в Dashboard | Subject |
|---|---|---|
| `confirm-signup.html` | **Confirm signup** | `Підтвердіть реєстрацію в TradeM` |
| `reset-password.html` | **Reset password** | `Скидання пароля — TradeM` |
| `magic-link.html` | **Magic Link** | `Ваше посилання для входу — TradeM` |
| `change-email.html` | **Change Email Address** | `Підтвердження зміни email — TradeM` |
| `invite.html` | **Invite user** | `Вас запрошено до TradeM` |

## Змінні Supabase, що використовуються

- `{{ .ConfirmationURL }}` — посилання дії (усі шаблони). Веде на `emailRedirectTo` → `/auth/callback`.
- `{{ .Email }}` / `{{ .NewEmail }}` — стара / нова адреса (тільки `change-email.html`).

## Нотатки

- **Логотип**: `https://trade-mua.vercel.app/logo.png`. Якщо домен зміниться — оновіть `src` у всіх файлах. Бренд продубльовано текстовим вордмарком `TradeM`, тож лист читається навіть із заблокованими зображеннями.
- **Контакти у футері**: `@BOSSDnepra`, `097-422-50-60 Денис` — синхронізовано з `Footer.tsx`. Оновлюйте разом.
- **Шрифт Syne** підвантажується через Google Fonts (працює в Apple Mail / iOS); у решті клієнтів — fallback на Arial з uppercase + letter-spacing, що зберігає індустріальний характер.
- Кольори: фон `#0e0e0a`, картка `#1a1918`, бордер `#2e2d2b`, золото `#ecc246`, заливка кнопки `#c9a227`.
