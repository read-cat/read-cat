
export const useImportBooks = () => {
  
  const fileDragChange = (files: File[]) => {
    console.log(files);
    
  }


  return {
    fileDragChange
  }
}