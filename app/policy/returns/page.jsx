import SiteChrome from "@/components/SiteChrome";
import { PolicyPage } from "@/components/ui";
export const metadata = { title: "Returns & Refund Policy" };
export default function Page(){return <SiteChrome content={<PolicyPage title="Returns & Refund Policy"
 intro="We want you to love your skincare. Here's how returns and refunds work."
 sections={[
  {h:"7-Day Returns",p:["Unopened products in original packaging can be returned within 7 days of delivery. For hygiene reasons, opened skincare cannot be returned unless defective."]},
  {h:"Damaged or Wrong Items",p:["If you receive a damaged or incorrect item, contact us within 48 hours at info@awishclinic.com with photos and we'll arrange a replacement or refund."]},
  {h:"Refund Timeline",p:["Approved refunds are processed to the original payment method within 5–7 business days."]},
  {h:"How to Request",p:["Email info@awishclinic.com or call +91 9310032619 with your order number."]},
 ]}/>} />;}
