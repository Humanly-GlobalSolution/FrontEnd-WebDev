import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateCrossingSeconds, compareCrossing } from "../src/lib/crossings.ts";
import { crossingCatalog, getCrossingMetadata } from "../src/data/crossingCatalog.ts";
const cases = [
 {code:'C01',width:30,current:20,guarantee:40,button:[26,40,52]},
 {code:'C02',width:27.4,current:35,guarantee:37,button:[35,38,47]},
 {code:'C03',width:36.96,current:47,guarantee:50,button:[47,50,62]},
 {code:'C04',width:19.5,current:24,guarantee:26,button:[24,27,33]},
 {code:'C05',width:27.82,current:36,guarantee:38,button:[36,39,48]},
];
for(const row of cases) test(row.code + ': same times for all activation methods',()=>{
 assert.equal(calculateCrossingSeconds(row.width),row.guarantee);
 for(const [i,profile] of ['adult','elderly','reducedMobility'].entries()){
  for(const activation of ['button','sensor','card']){
   const before=compareCrossing(row.width,row.current,false,profile,activation,row.code);
   const after=compareCrossing(row.width,row.current,true,profile,activation,row.code);
   assert.equal(before.seconds,row.current);
   assert.equal(before.alert,false);
   assert.equal(after.seconds,row.button[i]);
   assert.deepEqual(after,compareCrossing(row.width,row.current,true,profile,'button',row.code));
   assert.equal(after.guaranteedSeconds,row.code==='C01' && profile!=='adult' ? 40 : row.current);
   assert.equal(after.alert,false);
   assert.ok(after.extraSeconds<=15 && after.extraSeconds%3===0);
  }
 }

});
test("catálogo mantém os três IDs e distingue medidas de estimativas", () => {
  assert.deepEqual(Object.keys(crossingCatalog), ["C02", "C03", "C05"]);
  for (const [code, crossing] of Object.entries(crossingCatalog)) {
    assert.equal(crossing.id, `urn:ngsi-ld:Cruzamento:${code}`);
    assert.equal(crossing.metadata.greenSeconds + crossing.metadata.flashingSeconds, crossing.currentSeconds);
    assert.equal(crossing.metadata.widthSource, "Google Earth");
    assert.equal(crossing.metadata.timingSource, "estimated");
    assert.deepEqual(getCrossingMetadata(crossing), crossing.metadata);
    assert.ok(crossing.metadata.latitude < -23.54 && crossing.metadata.latitude > -23.58);
    assert.ok(crossing.metadata.longitude < -46.63 && crossing.metadata.longitude > -46.68);
  }
  assert.equal(new Set(Object.values(crossingCatalog).map((c) => `${c.metadata.latitude},${c.metadata.longitude}`)).size, 3);
});

test("não associa coordenadas novas aos registros antigos do Orion antes do PATCH autorizado", () => {
  const old = { id: "urn:ngsi-ld:Cruzamento:C02", code: "C02", address: "Av. Paulista x Rua Pamplona", width: 11.5, currentSeconds: 24 };
  const before = structuredClone(old);
  assert.equal(getCrossingMetadata(old), undefined);
  assert.deepEqual(old, before);
  assert.equal(getCrossingMetadata({ ...crossingCatalog.C02, currentSeconds: 24 }), undefined);
});


test('No extra time when sufficient; card never reduces current total',()=>{
 const r=compareCrossing(3,60,true,'reducedMobility','card');
 assert.equal(r.extraSeconds,0);assert.equal(r.seconds,60);assert.equal(r.alert,false);
});
test('Exactly 15 seconds can finish without alert; insufficiency raises alert',()=>{
 const exact=compareCrossing(36,45,true,'reducedMobility','button');
 assert.equal(exact.extraSeconds,15);assert.equal(exact.alert,false);
 const short=compareCrossing(60,24,true,'elderly','sensor');
 assert.equal(short.seconds,39);assert.equal(short.alert,true);assert.equal(short.referenceRemaining,30.75);
});
test('Validate calculation inputs',()=>{
 for(const value of [0,-1,NaN,Infinity]){
  assert.throws(()=>compareCrossing(value,20,true),RangeError);
  assert.throws(()=>compareCrossing(30,value,true),RangeError);
 }
 assert.throws(()=>compareCrossing(30,20,true,'invalid'),RangeError);
 assert.throws(()=>compareCrossing(30,20,true,'elderly','invalid'),RangeError);
});

test('C01 accessible guarantee completes elderly and PcD crossing for all activations',()=>{
 for(const activation of ['button','sensor','card']) {
  for(const [profile,total] of [['elderly',40],['reducedMobility',52]]) {
   const result=compareCrossing(30,20,true,profile,activation,'C01');
   assert.equal(result.seconds,total);
   assert.equal(result.guaranteedSeconds,40);
   assert.equal(result.referenceRemaining,0);
   assert.equal(result.alert,false);
   assert.ok(result.extraSeconds<=15 && result.extraSeconds%3===0);
   assert.equal(compareCrossing(30,20,false,profile,activation,'C01').seconds,20);
  }
  assert.equal(compareCrossing(30,20,true,'adult',activation,'C01').seconds,26);
 }
});
