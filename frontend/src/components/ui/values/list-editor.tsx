import type { TreeNode } from '@/state/tree'
import { IconSquareRoundedPlus } from '@tabler/icons-react'
import { Button } from '../button'
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious
} from '../pagination'

type OwnProps = {
	node: TreeNode
}

export const ListEditor = ({ node }: OwnProps) => {
	return (
		<div className="flex flex-row w-full h-7">
			<Button
				size="icon"
				variant="ghost"
				className="p-1 h-7 w-7 content-center"
			>
				<IconSquareRoundedPlus
					className="h-5 w-5 shrink-0 text-muted-foreground"
					stroke={1}
				/>
			</Button>
			<Pagination className="justify-end text-xs">
				<PaginationContent>
					<PaginationItem>
						<PaginationPrevious size="sm" href="#" />
					</PaginationItem>
					<PaginationItem>
						<PaginationLink href="#" size="sm">
							1
						</PaginationLink>
					</PaginationItem>
					<PaginationItem>
						<PaginationLink href="#" size="sm">
							2
						</PaginationLink>
					</PaginationItem>
					<PaginationItem>
						<PaginationLink href="#" size="sm">
							3
						</PaginationLink>
					</PaginationItem>
					<PaginationItem>
						<PaginationEllipsis />
					</PaginationItem>
					<PaginationItem>
						<PaginationNext size="sm" href="#" />
					</PaginationItem>
				</PaginationContent>
			</Pagination>
		</div>
	)
}
