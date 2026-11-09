// Run with node tests/chicken-engine.cjs
const fs = require('node:fs'), os = require('node:os'), path = require('node:path')
const assert = require('node:assert/strict')
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pawplay-chicken-'))
const output = path.join(dir, 'chicken.cjs')
require('esbuild').buildSync({entryPoints:[path.join(__dirname,'../src/lib/chicken.ts')],outfile:output,bundle:true,platform:'node',format:'cjs'})
const {CHICKEN_MODES, chickenMultiplier, chickenPayout, chickenSurvives} = require(output)
fs.rmSync(dir,{recursive:true,force:true})
for (const mode of Object.keys(CHICKEN_MODES)) {
 assert.equal(chickenMultiplier(0,mode),1)
 assert.equal(chickenPayout(50e6,0,mode),50e6)
 let previous=1
 for(let i=1;i<=12;i++) {
  const mult=chickenMultiplier(i,mode)
  assert(mult>previous);previous=mult
  assert.equal(chickenPayout(50e6,i,mode),Math.floor(50e6*mult))
  const expectation=CHICKEN_MODES[mode].survival**i*mult
  assert(expectation<=.96000000001 && expectation>.95)
 }
 assert(chickenSurvives(0,mode));assert(!chickenSurvives(CHICKEN_MODES[mode].survival,mode));assert(!chickenSurvives(.999999,mode))
}
assert.equal(chickenMultiplier(1,'classic'),1.17)
assert.equal(chickenMultiplier(12,'classic'),10.38)
console.log('Three modes: probabilities, 12 multipliers, exact payouts, expected return and classic compatibility OK')
