import SiteChrome from "@/components/SiteChrome";
import { AuthCard, Btn } from "@/components/ui";
export const metadata = { title: "Verify OTP" };
export default function Page() {
  return <SiteChrome content={
    <AuthCard title="Verify OTP" sub="Enter the 6-digit code sent to your mobile / email"
      footer={<>Didn't get it? <span className="text-[#3056D3] font-semibold">Resend OTP</span></>}>
      <div className="flex justify-center gap-2">
        {[0,1,2,3,4,5].map(i=>(<input key={i} maxLength={1} className="w-[44px] h-[52px] text-center text-[20px] font-bold rounded-[12px] border border-[rgba(111,115,132,0.4)] outline-none focus:border-[#3056D3]"/>))}
      </div>
      <Btn as="a" href="/account">Verify & Continue</Btn>
    </AuthCard>} />;
}
