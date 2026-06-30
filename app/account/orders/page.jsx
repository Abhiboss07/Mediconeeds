import AccountShell from "@/components/AccountShell";
import { sampleOrders, fmtINR } from "@/lib/models";
export const metadata = { title: "My Orders" };
export default function Page(){
  const orders=sampleOrders();
  return <AccountShell active="/account/orders" title="My Orders">
    <div className="space-y-3">{orders.map(o=>(
      <div key={o.id} className="bg-white rounded-[14px] border border-[rgba(111,115,132,0.18)] p-4 flex items-center gap-4">
        <img src={o.image} className="w-16 h-16 rounded-[10px] object-contain border border-[#eef0f5]"/>
        <div className="flex-1 min-w-0"><div className="text-[15px] font-semibold text-[#0e1b4d]">{o.title}</div><div className="text-[12px] text-[#6b7280]">Order #{o.id} · Placed {o.date} · {o.items} item(s)</div><span className="inline-block mt-1 text-[12px] font-semibold text-[#006f5f] bg-[rgba(0,111,95,0.08)] rounded-full px-3 py-1">{o.status}</span></div>
        <div className="text-right"><div className="text-[16px] font-bold text-[#0e1b4d]">{fmtINR(o.total)}</div><a href="#" className="text-[12px] font-semibold text-[#3056D3]">Track / Invoice</a></div>
      </div>))}
    </div>
  </AccountShell>;
}
