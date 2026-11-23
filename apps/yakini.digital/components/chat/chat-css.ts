export const CHAT_CSS = `
  .yk-av{position:relative;display:inline-block;flex:none;border-radius:50%;overflow:hidden;background:#0B1437;box-shadow:0 0 0 2px rgba(198,244,50,.35),0 8px 24px rgba(0,0,0,.35)}
  .yk-av video,.yk-av img,.yk-av canvas{width:100%;height:100%;object-fit:cover;display:block}
  .yk-av canvas{position:absolute;inset:0;pointer-events:none}
  .yk-av[data-speaking="true"]{box-shadow:0 0 0 3px rgba(198,244,50,.8),0 0 22px rgba(198,244,50,.35)}
  .yk-chat-launch{position:fixed;z-index:40;right:18px;bottom:18px;display:flex;align-items:center;gap:10px;padding:6px 14px 6px 6px;border:1px solid rgba(244,247,255,.16);border-radius:999px;background:rgba(6,11,36,.92);color:#F4F7FF;cursor:pointer;font:600 14px/1 Inter,system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.4)}
  .yk-chat-launch:hover{border-color:#C6F432}
  .yk-chat-launch-txt{display:flex;flex-direction:column;align-items:flex-start;gap:1px}
  .yk-chat-launch-txt b{font-size:14px}
  .yk-chat-launch-txt span{font-size:11px;font-weight:500;color:rgba(244,247,255,.7)}
  .yk-chat-panel{position:fixed;z-index:41;right:16px;bottom:16px;width:min(400px,calc(100vw - 20px));height:min(640px,calc(100svh - 24px));display:flex;flex-direction:column;border-radius:24px;background:rgba(6,11,36,.96);color:#F4F7FF;border:1px solid rgba(244,247,255,.14);box-shadow:0 20px 60px rgba(0,0,0,.5);overflow:hidden}
  .yk-chat-head{display:flex;align-items:center;flex-wrap:wrap;gap:10px 12px;padding:14px 14px 12px;border-bottom:1px solid rgba(244,247,255,.1)}
  .yk-chat-head h2{margin:0;font-size:18px;line-height:1.1}
  .yk-chat-head p{margin:2px 0 0;font-size:12px;color:rgba(244,247,255,.7)}
  .yk-chat-x{margin-left:auto;border:0;background:transparent;color:#F4F7FF;width:44px;height:44px;border-radius:50%;font-size:18px;cursor:pointer}
  .yk-chat-talk{flex:1 1 100%;display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 18px;border-radius:999px;border:1px solid rgba(198,244,50,.7);background:transparent;color:#C6F432;font:700 16px/1 Inter,system-ui,sans-serif;cursor:pointer}
  .yk-chat-talk[aria-pressed="true"]{background:#C6F432;color:#0B1437;border-color:#C6F432}
  .yk-chat-log{flex:1;overflow:auto;padding:14px;display:flex;flex-direction:column;gap:12px}
  .yk-chat-msg{max-width:92%;padding:10px 12px;border-radius:16px;font-size:15px;line-height:1.45}
  .yk-chat-msg.user{align-self:flex-end;background:#C6F432;color:#0B1437}
  .yk-chat-msg.assistant{align-self:flex-start;background:rgba(255,255,255,.07)}
  .yk-chat-msg .yk-chat-links{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
  .yk-chat-msg .yk-chat-links a,.yk-chat-hear{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;border:1px solid rgba(198,244,50,.5);color:#C6F432;text-decoration:none;font-size:12px;font-weight:600;background:transparent;cursor:pointer}
  .yk-chat-hear[disabled]{opacity:.4;cursor:not-allowed}
  .yk-chat-chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 8px}
  .yk-chat-chips button{border:1px solid rgba(244,247,255,.16);background:transparent;color:#F4F7FF;border-radius:999px;padding:7px 11px;font-size:12px;cursor:pointer}
  .yk-chat-form{display:flex;gap:8px;padding:10px 12px 12px;border-top:1px solid rgba(244,247,255,.1)}
  .yk-chat-form input{flex:1;min-width:0;border-radius:999px;border:1px solid rgba(244,247,255,.16);background:rgba(255,255,255,.06);color:#F4F7FF;padding:0 14px;height:44px;font:inherit}
  .yk-chat-form button{border:0;border-radius:999px;background:#C6F432;color:#0B1437;font-weight:700;padding:0 16px;height:44px;cursor:pointer}
  .yk-chat-lead{padding:8px 14px 12px;border-top:1px solid rgba(244,247,255,.1);font-size:13px}
  .yk-chat-lead input{width:100%;margin:6px 0;border-radius:10px;border:1px solid rgba(244,247,255,.16);background:rgba(255,255,255,.06);color:#F4F7FF;padding:8px 10px}
  .yk-chat-lead button{margin-top:4px;border:0;border-radius:999px;background:#C6F432;color:#0B1437;font-weight:700;padding:8px 14px;cursor:pointer}
  /* Keep kit chips and other demo controls clear of the fixed Ask Nikki launcher. */
  @media (min-width:761px){
    .db-chips,.db-actions,.db-brand{padding-right:240px}
    .yk-main{padding-bottom:120px}
  }
  @media (max-width:760px){
    .yk-chat-launch{right:12px;bottom:max(12px, env(safe-area-inset-bottom))}
    .yk-chat-panel{right:0;left:0;bottom:0;width:100%;height:min(92svh, 720px);border-radius:24px 24px 0 0}
    .yk-chat-talk{min-height:52px;font-size:17px}
    .db,.db-chips{padding-bottom:140px}
  }
  @media (prefers-reduced-motion:reduce){
    .yk-av video{display:none}
  }
`
