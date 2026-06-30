import SiteChrome from "@/components/SiteChrome";
import { PolicyPage } from "@/components/ui";
export const metadata = { title: "Shipping Policy" };
export default function Page(){return <SiteChrome content={<PolicyPage title="Shipping Policy"
 intro="We ship dermatologist-formulated skincare across India."
 sections={[
  {h:"Delivery Time",p:["Orders are dispatched within 1–2 business days and typically delivered in 3–7 business days depending on your location."]},
  {h:"Shipping Charges",p:["Free shipping on prepaid orders above ₹499. A nominal fee applies to smaller or COD orders, shown at checkout."]},
  {h:"Cash on Delivery",p:["COD is available across most pin codes in India."]},
  {h:"Order Tracking",p:["You'll receive tracking details by SMS and email once your order ships. Track anytime from your account."]},
 ]}/>} />;}
