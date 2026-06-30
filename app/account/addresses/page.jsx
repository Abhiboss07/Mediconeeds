import AccountShell from "@/components/AccountShell";
export const metadata = { title: "Saved Addresses" };
export default function Page(){
  const addrs=[{n:"Home",d:"232, Pocket J, Sarita Vihar, New Delhi 110076",p:"+91 9310032619",def:true},{n:"Work",d:"Connaught Place, New Delhi 110001",p:"+91 9310032619"}];
  return <AccountShell active="/account/addresses" title="Saved Addresses">
    <div className="grid lg:grid-cols-2 gap-4">{addrs.map((a,i)=>(
      <div key={i} className="bg-white rounded-[14px] border border-[rgba(111,115,132,0.18)] p-5">
        <div className="flex items-center gap-2 mb-1"><span className="text-[14px] font-bold text-[#0e1b4d]">{a.n}</span>{a.def&&<span className="text-[11px] font-semibold text-[#3056D3] bg-[rgba(48,86,211,0.1)] rounded-full px-2 py-0.5">Default</span>}</div>
        <p className="text-[14px] text-[#444]">{a.d}</p><p className="text-[13px] text-[#6b7280] mt-1">{a.p}</p>
        <div className="flex gap-3 mt-3 text-[13px] font-semibold"><a href="#" className="text-[#3056D3]">Edit</a><a href="#" className="text-[#cf5c2d]">Remove</a></div>
      </div>))}
      <button className="rounded-[14px] border-2 border-dashed border-[rgba(48,86,211,0.3)] p-5 text-[#3056D3] font-bold text-[14px]">+ Add New Address</button>
    </div>
  </AccountShell>;
}
