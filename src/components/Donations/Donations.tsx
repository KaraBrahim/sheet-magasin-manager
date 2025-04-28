
import React, { useState } from "react";
import DonationForm from "./DonationForm";
import DonationList from "./DonationList";
import { Button } from "@/components/ui/button";
import { PlusIcon, XIcon } from "lucide-react";

interface DonationsProps {
  onDonationAdded: () => void;
}

const Donations: React.FC<DonationsProps> = ({ onDonationAdded }) => {
  const [showForm, setShowForm] = useState(false);
  
  const handleDonationAdded = () => {
    setShowForm(false);
    onDonationAdded();
  };

  return (
    <div className="space-y-6">
      {!showForm ? (
        <div className="mb-4">
          <Button onClick={() => setShowForm(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Donation
          </Button>
        </div>
      ) : (
        <div className="relative border rounded-lg p-4 mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            className="absolute top-2 right-2"
            onClick={() => setShowForm(false)}
          >
            <XIcon className="h-4 w-4" />
          </Button>
          <DonationForm />
        </div>
      )}
      
      <DonationList />
    </div>
  );
};

export default Donations;
