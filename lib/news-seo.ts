export function newsSlug(title: string, id: string) {
 const slug=title.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[ʻʼ’‘]/g,"").replace(/[^\p{L}\p{N}]+/gu,"-").replace(/^-+|-+$/g,"").slice(0,90).replace(/-+$/g,"");
 return `${slug||"avtomobil-yangiliklari"}--${id}`;
}
export function newsIdFromSlug(slug: string) {
 const id=slug.split("--").at(-1)??"";
 return /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id)?id:null;
}
