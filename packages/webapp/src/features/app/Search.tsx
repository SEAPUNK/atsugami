import { Form, FormControl, FormField, FormItem } from "@/ui/form";
import { Input } from "@/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/ui/button";
import { useAppDispatch } from "@/store.hooks";
import { newSearch } from "./app.slice";

const formSchema = z.object({
  tags: z.string(),
});
type FormSchema = z.infer<typeof formSchema>;

export default function Search() {
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tags: "",
    },
  });

  const dispatch = useAppDispatch();

  function onSubmit(values: FormSchema) {
    dispatch(newSearch(values.tags.trim()));
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full h-full flex flex-row gap-2"
      >
        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  title="Input tags to search for, like you would in a booru."
                  placeholder="e.g. hakurei_reimu score:>5"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <Button variant="outline" type="submit">
          <FontAwesomeIcon icon={faMagnifyingGlass} />
        </Button>
      </form>
    </Form>
  );
}
