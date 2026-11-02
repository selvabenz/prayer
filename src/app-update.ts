/** Update the app shell without forcing an open editor to reload. */
export async function watchAppUpdates() {
  if (!('serviceWorker' in navigator)) return;
  const workers = navigator.serviceWorker;
  let controller = workers.controller;
  workers.addEventListener('controllerchange', () => {
    const previous = controller;
    controller = workers.controller;
    if (previous && controller !== previous) window.dispatchEvent(new Event('prayer-update'));
  });
  const registration = await workers.register(`${import.meta.env.BASE_URL}sw.js`, {updateViaCache:'none'});
  const activateWaiting = () => registration.waiting?.postMessage({type:'SKIP_WAITING'});
  activateWaiting();
  registration.addEventListener('updatefound', () => {
    registration.installing?.addEventListener('statechange', activateWaiting);
  });
  let checked = 0;
  const check = () => {
    if (Date.now()-checked<60000) return;
    checked=Date.now();
    void registration.update().catch(error=>console.warn('App update check unavailable:',error));
  };
  window.addEventListener('focus',check);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')check();});
  check();
}

export function reloadUpdatedApp() { window.location.reload(); }
