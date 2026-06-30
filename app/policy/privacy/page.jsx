import SiteChrome from "@/components/SiteChrome";
import { PolicyPage } from "@/components/ui";
export const metadata = { title: "Privacy Policy" };
export default function Page(){return <SiteChrome content={<PolicyPage title="Privacy Policy"
 intro="Mediconeeds (Dr Awish Clinic) respects your privacy. This policy explains what data we collect and how we use it."
 sections={[
  {h:"Information We Collect",p:["We collect details you provide at checkout or account creation — name, contact details, shipping address and order history — and basic usage data to improve our store."]},
  {h:"How We Use Your Data",p:["To process orders, provide customer support, send order updates, and (with consent) share skincare offers and recommendations."]},
  {h:"Data Sharing",p:["We share data only with trusted partners required to fulfil your order (payments, shipping). We never sell your personal data."]},
  {h:"Your Rights",p:["You may request access, correction or deletion of your data by writing to info@awishclinic.com."]},
  {h:"Cookies",p:["We use cookies to keep your cart, remember preferences and measure site performance. You can disable cookies in your browser."]},
 ]}/>} />;}
