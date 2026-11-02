// @vitest-environment jsdom
import {expect,it,vi} from 'vitest';
import {watchAppUpdates} from './app-update';

it('checks the worker without HTTP cache and announces activation without reloading a draft',async()=>{
  const waiting={postMessage:vi.fn()};
  const registration=Object.assign(new EventTarget(),{waiting,installing:null,update:vi.fn().mockResolvedValue(undefined)});
  const workers=Object.assign(new EventTarget(),{controller:{version:'old'},register:vi.fn().mockResolvedValue(registration)});
  Object.defineProperty(navigator,'serviceWorker',{value:workers,configurable:true});
  const ready=vi.fn();window.addEventListener('prayer-update',ready);
  try{
    await watchAppUpdates();
    expect(workers.register).toHaveBeenCalledWith('/sw.js',{updateViaCache:'none'});
    expect(registration.update).toHaveBeenCalledOnce();
    expect(waiting.postMessage).toHaveBeenCalledWith({type:'SKIP_WAITING'});
    expect(ready).not.toHaveBeenCalled();
    workers.controller={version:'new'};workers.dispatchEvent(new Event('controllerchange'));
    expect(ready).toHaveBeenCalledOnce();
  }finally{window.removeEventListener('prayer-update',ready);Reflect.deleteProperty(navigator,'serviceWorker');}
});
