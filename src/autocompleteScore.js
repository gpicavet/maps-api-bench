const Promise = require('bluebird');
const csv = require('csvdata');
const stringsim = require('string-similarity');

////////////////////////////////////////////////

const args = process.argv.slice(2);
const [inputCsv1] = args;

function getResults(csvrow) {
    let res=[];
    for(let i=1; i<=20; i++) {
        let v = csvrow[`result ${i}`];
        if(v) {
            res.push(v);
        } else {
            break;
        }
    }
    return res;
}

function score(query, res) {
    if(res.length==0)
        return 0;
    
    let sims = res.map((a,pos) => ({pos:pos,res:a,score:stringsim.compareTwoStrings(query,a)}));
    sims.sort((a,b)=>b.score-a.score);
    return sims[0];
}

let rows;
csv.load(inputCsv1, {delimiter: ';', parse:false, stream:false})
.then((res) => {
    rows=res;
})
.then(()=>{
    let rowsTr = rows.map(r=> {
        let res = getResults(r);
        let s = score(r['ref address'],res);
        return {id:r.id, ref_address:r['ref address'], query:r['query'], score:s}
    });
    let avgScore=rowsTr.reduce((a,e)=>a + (e.score.score>=0?e.score.score:0), 0) / rowsTr.length;
    let min=rowsTr.reduce((min,e)=> e.score.score<min.score.score?e:min, rowsTr[0]);
    for(let r of rowsTr) {
        console.log([r.id, r.ref_address, r.query, JSON.stringify(r.score)].join(';'));
    }
    console.log('average score = ',avgScore,'min score = ',min);
});