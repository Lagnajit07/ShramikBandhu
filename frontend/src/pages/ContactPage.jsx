import HomeButton from "../components/ui/HomeButton";
import LandingPage from "./LandingPage";
import { Button } from '../components/ui/button';

const ContactPage = () => {
  return (
    <div>
      
            {/* Contact Section */}
      <section className="contact-section py-16 bg-gray-100">
        <h2 className="section-title text-center mb-8">Contact Us</h2>
      
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
      
          <form 
            action="https://api.web3forms.com/submit"
            method="POST"
            className="grid grid-cols-1 gap-6"
          >
            {/* Web3Forms Key */}
            <input type="hidden" name="access_key" value={process.env.REACT_APP_WEB3FORMS_KEY} />
      
      
            <div>
              <label className="block font-medium mb-2">Your Name</label>
              <input
                type="text"
                name="name"
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your name"
                required
              />
            </div>
      
            <div>
              <label className="block font-medium mb-2">Mobile Number</label>
              <input
                type="tel"
                name="mobile"
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your mobile number"
                pattern="[0-9]{10}"
                maxLength="10"
                required
              />
            </div>
      
            <div>
              <label className="block font-medium mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
                required
              />
            </div>
      
            <div>
              <label className="block font-medium mb-2">Message</label>
              <textarea
                name="message"
                className="w-full px-4 py-3 border rounded-lg h-32 focus:ring-2 focus:ring-blue-500"
                placeholder="Write your message"
                required
              />
            </div>
      
            <Button
              type="submit"
              className="w-full py-3 text-lg font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Send Message
            </Button>
          </form>
      
        </div>
      </section>
      
    </div>
  );
};

export default ContactPage;
