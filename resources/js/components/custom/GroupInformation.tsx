import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Users } from "lucide-react"

type props = {
  group?: any;
}

export default function GroupInformation({ group = {} }: props) {
  return (
    <Dialog>

      <DialogTrigger asChild className="mt-2">
        <Button variant="default"> <Users /> Group Information</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Group Information </DialogTitle>
          <DialogDescription>
            shows group information
          </DialogDescription>
        </DialogHeader>

        <hr />

        <div className=" h-[70vh] border overflow-auto">

          {
            Object.keys(group).map((key) => {
              if (typeof group[key] == "object") {
                return;
              }
              return (
                <p className="grid grid-cols-2 border-collapse"><span className="border p-1 bg-muted text-foreground/80 font-bold text-sm">{key.replaceAll("_", " ")}</span> <span className="border p-1 text-sm">{group[key]}</span></p>
              )
            })
          }
        </div>






        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>

        </DialogFooter>
      </DialogContent>

    </Dialog>
  )
}
