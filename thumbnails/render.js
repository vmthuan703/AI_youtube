const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport:{width:1280,height:720} });
  for (const n of ['thumbnail_1_brain_100x','thumbnail_2_before_after']) {
    await p.goto('file:///home/user/AI_youtube/thumbnails/'+n+'.svg');
    await p.screenshot({ path: n+'.png' });
  }
  await b.close();
})();
