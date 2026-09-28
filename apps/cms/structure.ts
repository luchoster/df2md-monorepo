import { CogIcon, FolderIcon, HomeIcon, PackageIcon } from '@sanity/icons'
import { orderableDocumentListDeskItem } from '@sanity/orderable-document-list'
import type { StructureResolver } from 'sanity/structure'
import { API_VERSION } from './lib/constants'

export const structure: StructureResolver = (S, context) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Home page')
        .icon(HomeIcon)
        .child(S.document().schemaType('homePage').documentId('homePage').title('Home page')),
      orderableDocumentListDeskItem({ type: 'page', title: 'Pages', S, context }),
      S.divider(),

      S.listItem()
        .title('Products')
        .icon(PackageIcon)
        .child(
          S.list()
            .title('Products')
            .items([
              S.listItem()
                .title('All products')
                .child(S.documentTypeList('product').title('All products')),
              S.listItem()
                .title('Featured')
                .child(
                  S.documentList()
                    .title('Featured')
                    .apiVersion(API_VERSION)
                    .filter('_type == "product" && featured == true')
                ),
              S.listItem()
                .title('Not active')
                .child(
                  S.documentList()
                    .title('Drafts & archived')
                    .apiVersion(API_VERSION)
                    .filter('_type == "product" && status != "active"')
                ),
              S.divider(),
              S.listItem()
                .title('By category')
                .child(
                  S.documentTypeList('category')
                    .title('Categories')
                    .child((categoryId) =>
                      S.documentList()
                        .title('Products')
                        .apiVersion(API_VERSION)
                        .filter('_type == "product" && $categoryId in categories[]._ref')
                        .params({ categoryId })
                    )
                ),
              S.listItem()
                .title('By brand')
                .child(
                  S.documentTypeList('brand')
                    .title('Brands')
                    .child((brandId) =>
                      S.documentList()
                        .title('Products')
                        .apiVersion(API_VERSION)
                        .filter('_type == "product" && brand._ref == $brandId')
                        .params({ brandId })
                    )
                )
            ])
        ),
      S.listItem()
        .title('Categories')
        .icon(FolderIcon)
        .child(
          S.list()
            .title('Categories')
            .items([
              S.listItem()
                .title('Category tree')
                .child(
                  S.documentList()
                    .title('Top level')
                    .apiVersion(API_VERSION)
                    .filter('_type == "category" && !defined(parent)')
                    .defaultOrdering([{ field: 'order', direction: 'asc' }])
                    .child((parentId) =>
                      S.documentList()
                        .title('Subcategories')
                        .apiVersion(API_VERSION)
                        .filter(
                          '_type == "category" && (parent._ref == $parentId || _id == $parentId)'
                        )
                        .params({ parentId })
                        .defaultOrdering([{ field: 'order', direction: 'asc' }])
                    )
                ),
              S.listItem()
                .title('All categories')
                .child(S.documentTypeList('category').title('All categories'))
            ])
        ),
      S.documentTypeListItem('brand').title('Brands'),
      S.divider(),
      S.listItem()
        .title('Site settings')
        .icon(CogIcon)
        .child(
          S.document().schemaType('siteSettings').documentId('siteSettings').title('Site settings')
        )
    ])
