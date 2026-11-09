// Run: node tests/poker-result.cjs
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'pawplay-poker-'))
const output = path.join(temp, 'poker.cjs')
require('esbuild').buildSync({ entryPoints: [path.join(__dirname, '../src/lib/poker.ts')], outfile: output, bundle: true, platform: 'node', format: 'cjs' })
const { evaluateHand, explainPokerResult } = require(output)
fs.rmSync(temp, { recursive: true, force: true })
const assert = require('node:assert/strict')
const c = (rank, suit = 'spades') => ({ rank, suit })
const game = (a,b,winner='player') => ({ winner, botName:'Bot', playerEvaluation:evaluateHand(a), botEvaluation:evaluateHand(b), folded:null })
const pairA = [c(8),c(8,'hearts'),c(14),c(5,'clubs'),c(2)]
const pairK = [c(8),c(8,'hearts'),c(13),c(5,'clubs'),c(2)]
assert.match(explainPokerResult(game(pairA,pairK)), /kicker.*As contre Roi/)
const trips = [c(9),c(9,'hearts'),c(9,'clubs'),c(5),c(2)]
assert.match(explainPokerResult(game(trips,pairA)), /Brelan.*bat.*Paire/)
assert.match(explainPokerResult(game(pairA,pairA,'tie')), /partagé/)
assert.match(explainPokerResult({...game(pairA,pairK),folded:'bot'}), /abandonné/)
const pair9 = [c(9),c(9,'hearts'),c(14),c(5,'clubs'),c(2)]
assert.match(explainPokerResult(game(pair9,pairA)), /hauteur.*Neuf contre Huit/)
console.log('Poker explanations: kicker, category, rank, split and fold OK')

const quads = kicker => [c(8),c(8,'hearts'),c(8,'clubs'),c(8,'diamonds'),c(kicker)]
assert.match(explainPokerResult(game(quads(14),quads(13))), /kicker.*As contre Roi/)
