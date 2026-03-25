"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateContact, useUpdateContact } from "@/hooks/use-contacts";
import { toast } from "sonner";
import type { Contact, CreateContactInput } from "@/types/contact";

interface ContactFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact | null;
  locationId: string;
}

export function ContactForm({ open, onOpenChange, contact, locationId }: ContactFormProps) {
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const isEditing = !!contact;

  const [formData, setFormData] = useState({
    firstName: contact?.firstName || "",
    lastName: contact?.lastName || "",
    email: contact?.email || "",
    phone: contact?.phone || "",
    companyName: contact?.companyName || "",
    address1: contact?.address1 || "",
    city: contact?.city || "",
    state: contact?.state || "",
    postalCode: contact?.postalCode || "",
  });

  useEffect(() => {
    if (open) {
      setFormData({
        firstName: contact?.firstName || "",
        lastName: contact?.lastName || "",
        email: contact?.email || "",
        phone: contact?.phone || "",
        companyName: contact?.companyName || "",
        address1: contact?.address1 || "",
        city: contact?.city || "",
        state: contact?.state || "",
        postalCode: contact?.postalCode || "",
      });
    }
  }, [open, contact]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && contact) {
        await updateContact.mutateAsync({ id: contact.id, ...formData });
        toast.success("Contact updated successfully");
      } else {
        await createContact.mutateAsync({ ...formData, locationId } as CreateContactInput);
        toast.success("Contact created successfully");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(isEditing ? "Failed to update contact" : "Failed to create contact");
    }
  };

  const isPending = createContact.isPending || updateContact.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Contact" : "New Contact"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update contact information" : "Add a new contact to your CRM"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Doe"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder="Acme Inc."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEditing ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
