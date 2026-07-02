// ============================================================
// forms.js — единый слой отправки заявок (абстракция провайдера)
// ------------------------------------------------------------
// Сейчас: Netlify Forms (бесплатно, заявки приходят на e-mail и в дашборд).
// Позже: меняется ТОЛЬКО функция sendToProvider() — разметка форм и UX
// остаются прежними. Заложены варианты email / AmoCRM / Битрикс24 / Sheets.
// ============================================================
(function () {
  'use strict';

  // Конфиг провайдера. Меняйте здесь при подключении CRM.
  // 'netlify' — Netlify Forms; 'webhook' — POST на свой URL/CRM; 'mailto' — открыть письмо.
  const CONFIG = {
    provider: 'netlify',
    webhookUrl: '', // TODO: указать endpoint (свой сервер / Zapier / Make / CRM)
    fallbackEmail: 'Elenabbocharova@yandex.ru', // используется для mailto-фолбэка
  };

  async function sendToProvider(formName, data) {
    switch (CONFIG.provider) {
      case 'webhook': {
        if (!CONFIG.webhookUrl) throw new Error('webhookUrl не задан');
        const res = await fetch(CONFIG.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ form: formName, data }),
        });
        if (!res.ok) throw new Error('Ошибка отправки: ' + res.status);
        return;
      }
      case 'mailto': {
        const subj = encodeURIComponent('Заявка с сайта: ' + formName);
        const body = encodeURIComponent(
          Object.entries(data).map(([k, v]) => `${k}: ${v}`).join('\n')
        );
        window.location.href = `mailto:${CONFIG.fallbackEmail}?subject=${subj}&body=${body}`;
        return;
      }
      case 'netlify':
      default: {
        const params = new URLSearchParams();
        params.append('form-name', formName);
        Object.entries(data).forEach(([k, v]) => params.append(k, v));
        const res = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
        });
        if (!res.ok) throw new Error('netlify ' + res.status);
        return;
      }
    }
  }

  function trackGoal(formName) {
    if (window.SiteCookies && window.SiteCookies.canUseAnalytics && !window.SiteCookies.canUseAnalytics()) return;
    // Заложены цели аналитики (Метрика / VK). Подключаются при наличии ID.
    try {
      if (window.ym && window.__YM_ID__) window.ym(window.__YM_ID__, 'reachGoal', 'form_' + formName);
      if (window.VK && window.VK.Goal) window.VK.Goal('lead');
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'form_submit', form_name: formName });
    } catch (_e) {}
  }

  function bindForm(form) {
    const name = form.getAttribute('data-form') || form.getAttribute('name') || 'contact';
    const status = form.querySelector('.form-status');
    const submitBtn = form.querySelector('[type="submit"]');

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (status) { status.textContent = ''; status.className = 'form-status'; }

      const consent = form.querySelector('input[name="consent"]');
      if (consent && !consent.checked) {
        if (status) { status.textContent = 'Нужно согласие на обработку персональных данных.'; status.classList.add('is-err'); }
        return;
      }

      const fd = new FormData(form);
      const data = {};
      fd.forEach((v, k) => { if (k !== 'consent' && k !== 'bot-field') data[k] = v; });
      data.consent = consent ? 'да' : '';
      data._page = location.pathname;

      if (submitBtn) { submitBtn.disabled = true; submitBtn.dataset.label = submitBtn.textContent; submitBtn.textContent = 'Отправляем…'; }

      try {
        await sendToProvider(name, data);
        trackGoal(name);
        form.reset();
        if (status) { status.textContent = form.getAttribute('data-success') || 'Спасибо! Заявка отправлена — Елена свяжется с вами.'; status.classList.add('is-ok'); }
      } catch (err) {
        // Фолбэк: предлагаем написать на почту (важно для локального предпросмотра без backend)
        if (status) {
          status.innerHTML = 'Не удалось отправить автоматически. Напишите, пожалуйста, на <a href="mailto:' +
            CONFIG.fallbackEmail + '">' + CONFIG.fallbackEmail + '</a>.';
          status.classList.add('is-err');
        }
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = submitBtn.dataset.label || 'Отправить'; }
      }
    });
  }

  window.SiteForms = {
    config: CONFIG,
    init() {
      document.querySelectorAll('form[data-form]').forEach(bindForm);
      const phoneHint = '+7 … · @telegram · WhatsApp';
      document.querySelectorAll('input[name="phone"], input[type="tel"][id*="phone"]').forEach((el) => {
        if (!el.getAttribute('placeholder')) el.setAttribute('placeholder', phoneHint);
      });
      document.querySelectorAll('[data-set-intent]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const href = btn.getAttribute('href');
          if (!href || !href.includes('#')) return;
          const id = href.split('#')[1];
          const section = document.getElementById(id);
          const field = section && section.querySelector('[name="intent"]');
          if (field) field.value = btn.dataset.setIntent || '';
        });
      });
    },
  };
})();
