const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport:{width:1280,height:720} });
  for (const n of ['v2_thumbnail_1_brain_100x','v2_thumbnail_2_before_after']) {
    await p.goto('file://'+__dirname+'/'+n+'.svg'); await p.screenshot({ path: __dirname+'/'+n+'.png' });
  }
  await b.close();
})();
