import { useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useCreatePlaylist } from "@/hooks/useLibrary";

export function CreatePlaylistDialog({ trigger }: { trigger: ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const createPlaylist = useCreatePlaylist();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleOpenChange = (next: boolean) => {
    if (next && !user) {
      toast("Sign in to create playlists.");
      void navigate({ to: "/auth" });
      return;
    }
    setOpen(next);
  };

  const submit = async () => {
    if (!name.trim()) {
      toast.error("Give your playlist a name first.");
      return;
    }
    const playlist = await createPlaylist.mutateAsync({ name: name.trim(), description: description.trim() });
    setOpen(false);
    setName("");
    setDescription("");
    void navigate({ to: "/playlist/$id", params: { id: playlist.id } });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New playlist</DialogTitle>
          <DialogDescription>Collect the tracks that belong together.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="playlist-name">Name</Label>
            <Input
              id="playlist-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Late night drive"
              maxLength={80}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="playlist-description">Description</Label>
            <Textarea
              id="playlist-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional — what's the mood?"
              maxLength={300}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={createPlaylist.isPending}>
            {createPlaylist.isPending ? "Creating…" : "Create playlist"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
