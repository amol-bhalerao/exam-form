const fs=require('fs');
const data=JSON.parse(fs.readFileSync('tmp_subject_list_all.json','utf8'));
const cat={language:'Language','Compulsory':'Compulsory','Optional Subjects':'Optional','Bifocal Subjects':'Bifocal','Vocational Subjects':'Vocational'};
const lines=data.map(s=>{
  const code=String(s.code).replace(/'/g, "\\'");
  const name=String(s.name).replace(/'/g, "\\'");
  const category=cat[s.sheet]||'Other';
  return `    { code: '${code}', name: '${name}', category: '${category}' },`;
});
fs.writeFileSync('tmp_subject_array.txt', lines.join('\n'));
console.log('wrote', lines.length);
