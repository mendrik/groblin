import { Query, Resolver } from "type-graphql";
import { Node } from '@shared/models/node'

@Resolver()
class NodeResolver {
  
  @Query(returns => [Node])
  async recipes() {
    return await this.recipesCollection;
  }
}