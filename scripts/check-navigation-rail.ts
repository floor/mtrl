#!/usr/bin/env bun
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import type { NavigationRailComponent, NavigationRailConfig } from '../src/components/navigation-rail/types';
declare global {
    interface Window {
        rail: NavigationRailComponent;
        mountRail: (config: NavigationRailConfig) => void;
    }
}
const artifacts = resolve('analysis/navigation-rail');
await mkdir(artifacts, { recursive: true });
const build = await Bun.build({ entrypoints: [resolve('dist/components/navigation-rail/index.js')], target: 'browser', minify: true });
assert(build.success, String(build.logs));
const js = await build.outputs[0].text();
const server = Bun.serve({ hostname: '127.0.0.1', port: 0, fetch(request) {
        const url = new URL(request.url);
        if (url.pathname === '/rail.js')
            return new Response(js, { headers: { 'Content-Type': 'text/javascript' } });
        if (url.pathname === '/full.css')
            return new Response(Bun.file('dist/styles.css'));
        if (url.pathname === '/base.css')
            return new Response(Bun.file('dist/styles/base.css'));
        if (url.pathname === '/rail.css')
            return new Response(Bun.file('dist/styles/navigation-rail.css'));
        const styles = url.searchParams.has('selective') ? '<link rel="stylesheet" href="/base.css"><link rel="stylesheet" href="/rail.css">' : '<link rel="stylesheet" href="/full.css">';
        return new Response(`<!doctype html><html><head>${styles}<style>body{margin:0;display:flex;height:100vh}main{padding:24px;flex:1}</style></head><body><main><button id="outside">Open navigation</button></main><script type="module">
  import createNavigationRail from '/rail.js';
  const icon='<svg viewBox="0 0 24 24"><path d="M3 5h18v14H3zm2 2v1l7 4 7-4V7l-7 4z"/></svg>';
  window.mountRail=config=>{window.rail?.destroy();window.rail=createNavigationRail({items:[{id:'inbox',label:'Inbox',icon,active:true,badge:24},{id:'sent',label:'Sent',icon,href:'/sent'},{id:'disabled',label:'Disabled',icon,disabled:true},{id:'family',label:'Family',icon,badge:true,badgeLabel:'New messages'}],onSelect:event=>event.originalEvent.preventDefault(),...config});document.body.prepend(window.rail.element)};
  document.querySelector('#outside').onclick=()=>window.rail.expand();
  </script></body></html>`, { headers: { 'Content-Type': 'text/html' } });
    } });
const browser = await chromium.launch();
try {
    const pages = await Promise.all([browser.newPage({ reducedMotion: 'reduce' }), browser.newPage({ reducedMotion: 'reduce' })]);
    const errors: string[] = [];
    for (const [i, page] of pages.entries()) {
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(`http://127.0.0.1:${server.port}/${i ? '?selective' : ''}`);
        await page.waitForFunction(() => !!window.mountRail);
    }
    let count = 0;
    for (const expanded of [false, true])
        for (const direction of ['ltr', 'rtl'])
            for (const mode of ['light', 'dark'])
                for (const height of [360, 720]) {
                    for (const page of pages) {
                        await page.setViewportSize({ width: 900, height });
                        await page.evaluate(({ expanded, direction, mode }) => {
                            document.documentElement.dir = direction;
                            document.documentElement.dataset.theme = 'baseline';
                            document.documentElement.dataset.themeMode = mode;
                            window.mountRail({ expanded });
                        }, { expanded, direction, mode });
                        const geometry = await page.locator('.mtrl-navigation-rail').boundingBox();
                        assert(geometry);
                        assert.equal(geometry.width, expanded ? 280 : 96);
                        const item = page.locator('[data-id="inbox"]');
                        assert.equal((await item.boundingBox())!.width, geometry.width, 'Destination hit target must span the rail');
                        const indicator = await item.locator('.mtrl-navigation-rail__indicator').boundingBox();
                        assert(indicator);
                        assert.equal(indicator.height, expanded ? 56 : 32);
                        if (!expanded)
                            assert.equal(indicator.width, 56);
                        await item.focus();
                        await page.keyboard.press('ArrowDown');
                        await page.keyboard.press('ArrowDown');
                        assert.equal(await page.locator('[data-id="family"]').evaluate(el => el === document.activeElement), true);
                        assert.equal(await page.evaluate(() => window.rail.getActive()), 'inbox');
                        await page.keyboard.press('Enter');
                        assert.equal(await page.evaluate(() => window.rail.getActive()), 'family');
                        await page.evaluate(() => { window.rail.element.scrollTop = 0; return new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))); });
                    }
                    const full = await pages[0].screenshot({ path: `${artifacts}/${expanded ? 'expanded' : 'collapsed'}-${direction}-${mode}-${height}.png` });
                    const selective = await pages[1].screenshot({ path: `${artifacts}/selective.png` });
                    assert(full.equals(selective), 'Full and selective rail CSS differ');
                    count++;
                }
    const page = pages[0];
    await page.evaluate(() => { window.mountRail({ expanded: false }); window.rail.element.querySelector<HTMLElement>('[data-id="inbox"]')!.focus(); window.rail.expand(); });
    assert.equal(await page.locator('[data-id="inbox"]').evaluate(el => el === document.activeElement), true);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.locator('[data-id="sent"]').click();
    await page.waitForFunction(() => document.querySelectorAll('.mtrl-navigation-rail__ripple').length === 0, undefined, { timeout: 2000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(() => window.mountRail({ layout: 'modal' }));
    await page.click('#outside');
    assert.equal(await page.getByRole('dialog').count(), 1);
    for (let i = 0; i < 8; i++) {
        await page.keyboard.press('Tab');
        assert.equal(await page.evaluate(() => window.rail.element.contains(document.activeElement)), true);
    }
    await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('dialog').count(), 0);
    assert.equal(await page.locator('#outside').evaluate(el => el === document.activeElement), true);
    await page.evaluate(() => { window.mountRail({ layout: 'modal', expanded: true }); });
    await page.waitForFunction(() => document.querySelector('dialog')?.open);
    const modalBox = await page.getByRole("dialog").boundingBox();
    assert(modalBox);
    await page.mouse.click(modalBox.x > 0 ? 20 : 880, 700);
    assert.equal(await page.evaluate(() => window.rail.isExpanded()), false);
    for (let i = 0; i < 40; i++) {
        await page.evaluate(() => window.mountRail({ layout: 'modal', expanded: true }));
        await page.waitForFunction(() => document.querySelector('dialog')?.open);
        await page.evaluate(() => window.rail.destroy());
    }
    assert.equal(await page.locator('.mtrl-navigation-rail').count(), 0);
    assert.deepEqual(errors, []);
    console.log(`Passed ${count} full/selective Expressive rail scenes, keyboard selection, ripple, expansion, native modal focus/Escape/scrim, and 40 teardown cycles.`);
}
finally {
    await browser.close();
    server.stop(true);
}
