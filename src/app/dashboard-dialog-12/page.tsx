import { Button } from '@/components/ui/button'
import UpdateProductDialog from '@/components/shadcn-studio/blocks/dashboard-dialog-12/dialog-update-product'

const DialogPage = () => {
  return (
    <div className='flex h-dvh items-start justify-center p-8'>
      <UpdateProductDialog
        defaultOpen
        trigger={
          <Button variant='outline'>
            <span>Update Product</span>
          </Button>
        }
      />
    </div>
  )
}

export default DialogPage
