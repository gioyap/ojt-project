"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
	className,
	classNames,
	showOutsideDays = true,
	...props
}: CalendarProps) {
	return (
		<DayPicker
			showOutsideDays={showOutsideDays}
			className={cn("p-3", className)}
			modifiersClassNames={{
				selected:
					"bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
				today: "bg-accent text-accent-foreground",
				outside: "text-muted-foreground",
				disabled: "text-muted-foreground opacity-50",
			}}
			classNames={{
				months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
				month: "space-y-4",
				caption: "flex justify-between items-center py-2",
				caption_label: "text-sm font-medium",
				nav: "flex items-center gap-1",
				nav_button: cn(
					buttonVariants({ variant: "outline" }),
					"h-7 w-7 p-0 opacity-50 hover:opacity-100"
				),
				table: "w-full border-collapse",
				head_row: "flex",
				head_cell: "text-muted-foreground rounded-md w-9 font-normal text-sm",
				row: "flex w-full",
				cell: "h-9 w-9 text-center text-sm p-0 relative",
				day: cn(
					buttonVariants({ variant: "ghost" }),
					"h-9 w-9 p-0 font-normal aria-selected:opacity-100"
				),
			}}
			{...props}
		/>
	);
}

Calendar.displayName = "Calendar";

export { Calendar };
