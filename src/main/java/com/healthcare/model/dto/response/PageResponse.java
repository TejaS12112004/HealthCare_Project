package com.healthcare.model.dto.response;

import lombok.Builder;
import lombok.Data;

/**
 * Generic paginated list wrapper returned by list endpoints.
 *
 * @param <T> the type of items in the page
 */
@Data
@Builder
public class PageResponse<T> {

    private java.util.List<T> content;
    private int   pageNumber;
    private int   pageSize;
    private long  totalElements;
    private int   totalPages;
    private boolean last;
    private boolean first;
}
