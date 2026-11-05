const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport:{width:1280,height:720} });
  for (const n of ['v3_thumbnail_1_level_up','v3_thumbnail_2_cant_forget','v3_thumbnail_3_big_eyes']) {
    await p.goto('file://'+__dirname+'/'+n+'.svg'); await p.waitForTimeout(400); await p.screenshot({ path: __dirname+'/'+n+'.png' });
  }
  await b.close();
})();
