import { config } from '../config'

/**
 * Trang HTML người chơi nhìn thấy trong TRÌNH DUYỆT sau khi bấm xong Google.
 *
 * Cố ý giữ tối giản và không có JavaScript ngoài một lệnh thử đóng tab:
 * đây là trang chạy ngoài tầm kiểm soát của game, càng ít bề mặt tấn công
 * càng tốt. Không nhúng bất kỳ dữ liệu nào của người dùng vào đây.
 */

const BASE_STYLE = `
  *{margin:0;padding:0;box-sizing:border-box}
  body{
    min-height:100vh;display:flex;align-items:center;justify-content:center;
    background:#14100f;color:#efe6d8;padding:24px;
    font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  }
  .card{
    max-width:420px;width:100%;text-align:center;
    background:#1f1917;border:1px solid #3a2f28;border-radius:16px;padding:40px 28px;
  }
  .mark{font-size:52px;line-height:1;margin-bottom:20px}
  h1{font-size:21px;font-weight:600;margin-bottom:10px;letter-spacing:.2px}
  p{font-size:15px;line-height:1.65;color:#a99d8e}
  .app{margin-top:26px;padding-top:18px;border-top:1px solid #3a2f28;
       font-size:12px;color:#6b6058;letter-spacing:.6px;text-transform:uppercase}
  .ok h1{color:#e8c37a}
  .err h1{color:#e08c7a}
`

function page(opts: { cls: string; mark: string; title: string; body: string }): string {
  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${escapeHtml(opts.title)}</title>
<style>${BASE_STYLE}</style>
</head>
<body>
  <div class="card ${opts.cls}">
    <div class="mark">${opts.mark}</div>
    <h1>${escapeHtml(opts.title)}</h1>
    <p>${opts.body}</p>
    <div class="app">${escapeHtml(config.APP_DISPLAY_NAME)}</div>
  </div>
  <script>setTimeout(function(){try{window.close()}catch(e){}},2500)</script>
</body>
</html>`
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&': return '&amp;'
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '"': return '&quot;'
      default:  return '&#39;'
    }
  })
}

export function successPage(): string {
  return page({
    cls: 'ok',
    mark: '⚔️',
    title: 'Đăng nhập thành công',
    body: 'Bạn có thể đóng cửa sổ này và <strong>quay lại game</strong>.<br>Game sẽ tự vào trong giây lát.',
  })
}

export function deniedPage(): string {
  return page({
    cls: 'err',
    mark: '🚪',
    title: 'Đã huỷ đăng nhập',
    body: 'Bạn chưa cấp quyền cho ứng dụng.<br>Quay lại game và thử lại nếu muốn tiếp tục.',
  })
}

export function errorPage(): string {
  return page({
    cls: 'err',
    mark: '⚠️',
    title: 'Đăng nhập thất bại',
    body: 'Có lỗi xảy ra trong quá trình xác thực.<br>Vui lòng quay lại game và thử lại.',
  })
}

export function expiredPage(): string {
  return page({
    cls: 'err',
    mark: '⏳',
    title: 'Phiên đã hết hạn',
    body: 'Bạn để quá lâu nên phiên đăng nhập đã hết hiệu lực.<br>Quay lại game và bấm đăng nhập lại.',
  })
}
