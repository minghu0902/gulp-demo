
window.onload = function () {
  const html = template('list', { list: [1, 2, 3] });
  (document.getElementById('container') as any).innerHTML = html;
}