import AccountShell from "@/components/AccountShell";
export const metadata = { title: "Notifications" };
export default function Page(){
  const ns=[{t:"Your order #MN-10421 was delivered",d:"2 days ago"},{t:"Flat 33% off on Combos & Kits — limited time",d:"4 days ago"},{t:"New Launch: Dr Awish Retinol Face Serum",d:"1 week ago"},{t:"Your skin consultation is confirmed",d:"2 weeks ago"}];
  return <AccountShell active="/account/notifications" title="Notifications">
    <div className="bg-white rounded-[14px] border border-[rgba(111,115,132,0.18)] divide-y divide-[#eef0f5]">
      {ns.map((n,i)=>(<div key={i} className="flex items-start gap-3 p-4"><span className="w-2 h-2 rounded-full bg-[#3056D3] mt-2"/><div><div className="text-[14px] text-[#0e1b4d]">{n.t}</div><div className="text-[12px] text-[#9ca3af]">{n.d}</div></div></div>))}
    </div>
  </AccountShell>;
}
