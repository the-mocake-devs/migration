const BIBLE_BOOKS = [
["genesis","Genesis",50],["exodus","Exodus",40],["leviticus","Leviticus",27],["numeri","Numeri",36],["deuteronomium","Deuteronomium",34],["jozua","Jozua",24],["rechters","Rechters",21],["ruth","Ruth",4],["1-samuel","1 Samuel",31],["2-samuel","2 Samuel",24],["1-koningen","1 Koningen",22],["2-koningen","2 Koningen",25],["1-kronieken","1 Kronieken",29],["2-kronieken","2 Kronieken",36],["ezra","Ezra",10],["nehemia","Nehemia",13],["ester","Ester",10],["job","Job",42],["psalmen","Psalmen",150],["spreuken","Spreuken",31],["prediker","Prediker",12],["hooglied","Hooglied",8],["jesaja","Jesaja",66],["jeremia","Jeremia",52],["klaagliederen","Klaagliederen",5],["ezechiel","Ezechiël",48],["daniel","Daniël",12],["hosea","Hosea",14],["joel","Joël",3],["amos","Amos",9],["obadja","Obadja",1],["jona","Jona",4],["micha","Micha",7],["nahum","Nahum",3],["habakuk","Habakuk",3],["zefanja","Zefanja",3],["haggai","Haggai",2],["zacharia","Zacharia",14],["maleachi","Maleachi",4],
["matteus","Matteüs",28],["marcus","Marcus",16],["lucas","Lucas",24],["johannes","Johannes",21],["handelingen","Handelingen",28],["romeinen","Romeinen",16],["1-korintiers","1 Korintiërs",16],["2-korintiers","2 Korintiërs",13],["galaten","Galaten",6],["efeziers","Efeziërs",6],["filippenzen","Filippenzen",4],["kolossenzen","Kolossenzen",4],["1-tessalonicenzen","1 Tessalonicenzen",5],["2-tessalonicenzen","2 Tessalonicenzen",3],["1-timoteus","1 Timoteüs",6],["2-timoteus","2 Timoteüs",4],["titus","Titus",3],["filemon","Filemon",1],["hebreeen","Hebreeën",13],["jakobus","Jakobus",5],["1-petrus","1 Petrus",5],["2-petrus","2 Petrus",3],["1-johannes","1 Johannes",5],["2-johannes","2 Johannes",1],["3-johannes","3 Johannes",1],["judas","Judas",1],["openbaring","Openbaring",22]
].map((b,i)=>({slug:b[0],name:b[1],chapters:b[2],testament:i<39?"Oude Testament":"Nieuwe Testament"}));

const state = { data:null, book:null, chapter:1, mode:"reference" };
const $ = id => document.getElementById(id);
const normalize = value => value.toLocaleLowerCase("nl").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[’']/g,"").trim();
const bookAliases = new Map();
BIBLE_BOOKS.forEach(book => {
    [book.name,book.slug,book.name.replace(/^\d\s/,""),book.name.replace(/\s+/g,"")].forEach(alias => bookAliases.set(normalize(alias),book));
});

function setStatus(message="",type="") {
    const node=$("readerStatus");
    node.textContent=message;
    node.className=`reader-status ${type}`.trim();
}
function showView(view) {
    $("readerWelcome").hidden=view!=="welcome";
    $("chapterView").hidden=view!=="chapter";
    $("searchResultsView").hidden=view!=="results";
}
function renderBookLists(filter="") {
    const q=normalize(filter);
    ["oldBooks","newBooks"].forEach(id=>$(id).innerHTML="");
    BIBLE_BOOKS.filter(book=>!q||normalize(book.name).includes(q)).forEach(book=>{
        const button=document.createElement("button");
        button.type="button";
        button.className="book-button"+(state.book?.slug===book.slug?" active":"");
        button.innerHTML=`<span>${book.name}</span><small>${book.chapters}</small>`;
        button.addEventListener("click",()=>openChapter(book.slug,1));
        $(book.testament==="Oude Testament"?"oldBooks":"newBooks").append(button);
    });
}
function getBook(slugOrName) {
    const key=normalize(slugOrName);
    return BIBLE_BOOKS.find(b=>normalize(b.slug)===key||normalize(b.name)===key)||bookAliases.get(key)||null;
}
function getChapter(book,chapter) {
    if(!state.data||!book) return null;
    const entry=state.data.books?.[book.slug] ?? state.data.books?.[book.name] ?? null;
    if(!entry) return null;
    return Array.isArray(entry) ? entry[chapter-1] : entry[String(chapter)];
}
function getVerses(chapterData) {
    if(Array.isArray(chapterData)) return chapterData.map((v,i)=>typeof v==="string"?{verse:i+1,text:v}:{verse:Number(v.verse??i+1),text:String(v.text??"")});
    if(chapterData&&Array.isArray(chapterData.verses)) return getVerses(chapterData.verses);
    return [];
}
function updateUrl(book,chapter,verse=null) {
    const url=new URL(location.href);
    url.searchParams.set("boek",book.slug);
    url.searchParams.set("hoofdstuk",chapter);
    if(verse) url.searchParams.set("vers",verse); else url.searchParams.delete("vers");
    history.replaceState({}, "", url);
}
function renderChapter() {
    const chapterData=getChapter(state.book,state.chapter);
    $("chapterSelect").innerHTML="";
    for(let i=1;i<=state.book.chapters;i++){
        const option=document.createElement("option");
        option.value=i; option.textContent=`Hoofdstuk ${i}`; option.selected=i===state.chapter;
        $("chapterSelect").append(option);
    }
    $("chapterTitle").textContent=`${state.book.name} ${state.chapter}`;
    $("testamentName").textContent=state.book.testament.toUpperCase();
    if(!chapterData) {
        showView("chapter");
        $("chapterSubtitle").textContent="Hoofdstuktekst niet beschikbaar";
        $("verseContent").innerHTML="";
        setStatus("De hoofdstuknavigatie is klaar, maar de HSV-tekst is nog niet gekoppeld. Voeg de gelicentieerde tekst toe volgens data/README.md.","info");
        $("previousChapter").disabled=state.bookIndex===0&&state.chapter===1;
        $("nextChapter").disabled=state.bookIndex===BIBLE_BOOKS.length-1&&state.chapter===state.book.chapters;
        return;
    }
    const verses=getVerses(chapterData);
    $("verseContent").innerHTML="";
    verses.forEach(verse=>{
        const row=document.createElement("span");
        row.className="verse-row";
        row.id=`vers-${verse.verse}`;
        const number=document.createElement("sup");
        number.className="verse-number";
        number.textContent=verse.verse;
        const text=document.createElement("span");
        text.className="verse-text";
        text.textContent=verse.text+" ";
        row.append(number,text);
        $("verseContent").append(row);
    });
    $("chapterSubtitle").textContent=`Hoofdstuk ${state.chapter} · ${verses.length} verzen`;
    $("translationLabel").textContent=state.data.translation||"HSV";
    $("previousChapter").disabled=state.bookIndex===0&&state.chapter===1;
    $("nextChapter").disabled=state.bookIndex===BIBLE_BOOKS.length-1&&state.chapter===state.book.chapters;
    setStatus();
    const target=new URLSearchParams(location.search).get("vers");
    if(target) document.getElementById(`vers-${target}`)?.scrollIntoView({behavior:"smooth",block:"center"});
}
async function openChapter(bookSlug,chapter=1,verse=null) {
    const book=getBook(bookSlug);
    if(!book) return setStatus("Ik herken dat Bijbelboek niet. Controleer de naam en probeer opnieuw.","error");
    state.book=book;
    state.bookIndex=BIBLE_BOOKS.findIndex(b=>b.slug===book.slug);
    state.chapter=Math.min(Math.max(1,Number(chapter)||1),book.chapters);
    renderBookLists($("bookFilter").value);
    showView("chapter");
    renderChapter();
    updateUrl(book,state.chapter,verse);
    if(!getChapter(book,state.chapter)) setStatus(`Je hebt ${book.name} ${state.chapter} geselecteerd. De hoofdstuktekst verschijnt zodra het HSV-tekstbestand met geldige licentie is toegevoegd.`,"info");
}
function parseReference(query) {
    const input=normalize(query).replace(/[.,]/g," ");
    const match=input.match(/^(.*?)\s+(\d+)(?:\s*:\s*(\d+)(?:\s*[-–]\s*(\d+))?)?$/);
    if(!match) return null;
    const book=getBook(match[1]);
    if(!book) return null;
    const chapter=Number(match[2]);
    const verse=match[3]?Number(match[3]):null;
    if(chapter<1||chapter>book.chapters) return null;
    return {book,chapter,verse,endVerse:match[4]?Number(match[4]):verse};
}
function escapeHtml(value) {
    return value.replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}
function searchText(query) {
    if(!state.data) return setStatus("De Bijbeltekst is nog niet geladen. Voeg eerst het gelicentieerde tekstbestand toe.","error");
    const terms=normalize(query).split(/\s+/).filter(Boolean);
    if(!terms.length) return;
    const results=[];
    for(const book of BIBLE_BOOKS){
        const chapters=state.data.books?.[book.slug]??state.data.books?.[book.name];
        if(!chapters) continue;
        const entries=Array.isArray(chapters)?chapters:Object.values(chapters);
        entries.forEach((chapterData,index)=>{
            getVerses(chapterData).forEach(v=>{
                const haystack=normalize(v.text);
                if(terms.every(term=>haystack.includes(term))) results.push({book,chapter:index+1,verse:v.verse,text:v.text});
            });
        });
    }
    showView("results");
    $("searchResultsTitle").textContent=`Zoekresultaten voor “${query}”`;
    $("searchResultsMeta").textContent=`${results.length} resultaat${results.length===1?"":"en"}`;
    $("searchResults").innerHTML="";
    results.slice(0,100).forEach(result=>{
        const button=document.createElement("button");
        button.type="button"; button.className="search-result";
        const strong=document.createElement("strong");
        strong.textContent=`${result.book.name} ${result.chapter}:${result.verse}`;
        const span=document.createElement("span"); span.textContent=result.text;
        button.append(strong,span);
        button.addEventListener("click",()=>openChapter(result.book.slug,result.chapter,result.verse));
        $("searchResults").append(button);
    });
    if(!results.length) $("searchResults").textContent="Geen overeenkomende verzen gevonden.";
    if(results.length>100) setStatus("De eerste 100 resultaten worden getoond.","info"); else setStatus();
}
function searchReference(query) {
    const result=parseReference(query);
    if(!result) return setStatus("Deze verwijzing kon ik niet herkennen. Gebruik bijvoorbeeld Johannes 3:16 of Psalm 23.","error");
    if(!state.data) {
        openChapter(result.book.slug,result.chapter,result.verse);
        return;
    }
    const chapter=getChapter(result.book,result.chapter);
    if(!chapter) {
        openChapter(result.book.slug,result.chapter,result.verse);
        return;
    }
    openChapter(result.book.slug,result.chapter,result.verse);
    if(result.verse) {
        const verseNode=document.getElementById(`vers-${result.verse}`);
        if(verseNode) verseNode.classList.add("highlight");
    }
}
function moveChapter(direction) {
    if(!state.book) return;
    let index=state.bookIndex, chapter=state.chapter+direction;
    if(chapter<1){index--; if(index<0)return; chapter=BIBLE_BOOKS[index].chapters;}
    if(chapter>BIBLE_BOOKS[index].chapters){index++; if(index>=BIBLE_BOOKS.length)return; chapter=1;}
    openChapter(BIBLE_BOOKS[index].slug,chapter);
}
function switchMode(mode) {
    state.mode=mode;
    $("referenceTab").classList.toggle("active",mode==="reference");
    $("textTab").classList.toggle("active",mode==="text");
    $("referenceTab").setAttribute("aria-selected",String(mode==="reference"));
    $("textTab").setAttribute("aria-selected",String(mode==="text"));
    $("referenceForm").hidden=mode!=="reference";
    $("textForm").hidden=mode!=="text";
    $("searchNote").textContent=mode==="reference"?"Zoek bijvoorbeeld op Johannes 3:16, Romeinen 8 of Psalm 23.":"Zoek een woord of combinatie van woorden in alle beschikbare Bijbelverzen.";
}
async function loadBibleData() {
    try {
        const response=await fetch("/data/hsv.json",{cache:"no-store"});
        if(!response.ok) throw new Error("missing");
        state.data=await response.json();
        if(!state.data.books) throw new Error("invalid");
        $("translationLabel").textContent=state.data.translation||"HSV";
        setStatus("Bijbeltekst geladen.","");
        return true;
    } catch {
        state.data=null;
        setStatus("De reader-interface is klaar. De HSV-tekst is nog niet toegevoegd; daarvoor is een geldige licentie en het bijbehorende tekstbestand nodig.","info");
        return false;
    }
}

$("referenceTab").addEventListener("click",()=>switchMode("reference"));
$("textTab").addEventListener("click",()=>switchMode("text"));
$("referenceForm").addEventListener("submit",event=>{event.preventDefault();searchReference($("referenceInput").value.trim());});
$("textForm").addEventListener("submit",event=>{event.preventDefault();searchText($("textInput").value.trim());});
$("bookFilter").addEventListener("input",event=>renderBookLists(event.target.value));
$("chapterSelect").addEventListener("change",event=>openChapter(state.book.slug,Number(event.target.value)));
$("previousChapter").addEventListener("click",()=>moveChapter(-1));
$("nextChapter").addEventListener("click",()=>moveChapter(1));
$("copyLinkButton").addEventListener("click",async()=>{
    try { await navigator.clipboard.writeText(location.href); $("copyLinkButton").textContent="✓"; setTimeout(()=>$("copyLinkButton").textContent="↗",1300); }
    catch { setStatus("Kopiëren is niet beschikbaar in deze browser. Kopieer de URL uit de adresbalk.","info"); }
});
document.querySelectorAll("[data-reference]").forEach(button=>button.addEventListener("click",()=>{ $("referenceInput").value=button.dataset.reference; searchReference(button.dataset.reference); }));
document.addEventListener("keydown",event=>{if(event.altKey&&event.key==="ArrowLeft")moveChapter(-1);if(event.altKey&&event.key==="ArrowRight")moveChapter(1);});

renderBookLists();
loadBibleData().then(()=>{
    const params=new URLSearchParams(location.search);
    const book=params.get("boek"), chapter=params.get("hoofdstuk"), verse=params.get("vers");
    if(book&&chapter) openChapter(book,chapter,verse);
});
