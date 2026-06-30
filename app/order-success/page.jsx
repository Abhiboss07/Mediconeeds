import SiteChrome from "@/components/SiteChrome";
export const metadata = { title: "Order Confirmed" };
export default function Page(){
  const content=(
    <div className="max-w-[600px] mx-auto px-4 py-16 text-center">
      <div className="w-20 h-20 rounded-full bg-[rgba(0,111,95,0.12)] flex items-center justify-center mx-auto mb-6"><span className="text-[40px]">✅</span></div>
      <h1 className="text-[28px] font-extrabold text-[#0e1b4d]">Order Confirmed!</h1>
      <p className="text-[15px] text-[#6b7280] mt-3">Thank you for shopping with Mediconeeds. Your order <strong className="text-[#0e1b4d]">#MN-10422</strong> has been placed and a confirmation has been sent to your email.</p>
      <div className="bg-white rounded-[16px] border border-[rgba(111,115,132,0.18)] p-5 mt-7 text-left text-[14px]"><div className="flex justify-between py-1"><span className="text-[#6b7280]">Estimated delivery</span><span className="font-semibold">3–7 business days</span></div><div className="flex justify-between py-1"><span className="text-[#6b7280]">Payment</span><span className="font-semibold">UPI</span></div></div>
      <div className="flex gap-3 mt-7"><a href="/account/orders" className="flex-1 bg-[#3056D3] text-white text-[15px] font-bold rounded-full py-3">Track Order</a><a href="/products" className="flex-1 border border-[#3056D3] text-[#3056D3] text-[15px] font-bold rounded-full py-3">Continue Shopping</a></div>
    </div>);
  return <SiteChrome content={content}/>;
}
