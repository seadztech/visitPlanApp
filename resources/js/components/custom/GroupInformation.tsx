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



export default function GroupInformation() {
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
          
        
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
           
          </DialogFooter>
        </DialogContent>
    
    </Dialog>
  )
}
