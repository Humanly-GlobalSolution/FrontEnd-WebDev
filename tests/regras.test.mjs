import assert from 'node:assert/strict';
import { test } from 'node:test';
import { tempoNecessario, tempoGarantido, tempoFalhaSensor, ondeParaNoFimDoVerde } from '../src/lib/regras.ts';
for (const [width,speed,expected] of [[30,.75,40],[30,.6,50],[27.6,.6,46],[36.96,.6,62]]) test(`tempoNecessario ${width}/${speed}`,()=>assert.equal(tempoNecessario(width,speed),expected));
for (const [width,green,senior,especial] of [[30,20,40,50],[27.4,35,37,46],[36.96,47,50,62],[19.5,24,26,33],[27.82,36,38,47],[10,30,30,30]]) for(const [type,expected] of [['senior',senior],['especial',especial]]) test(`garantia ${width}/${green} ${type}`,()=>assert.equal(tempoGarantido(width,green,type),expected));
test('falha C01',()=>assert.equal(tempoFalhaSensor(30,20),50));
test('posição idoso C01',()=>assert.equal(ondeParaNoFimDoVerde(30,20,.75),15));
test('posição PcD C01',()=>assert.equal(ondeParaNoFimDoVerde(30,20,.6),12));
