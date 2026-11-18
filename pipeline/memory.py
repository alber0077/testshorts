from __future__ import annotations

import gc
from contextlib import contextmanager
from typing import Callable, Iterator, TypeVar

import torch

T = TypeVar("T")


def resolve_device(preferred: str = "auto") -> str:
    if preferred != "auto":
        return preferred
    if torch.cuda.is_available():
        return "cuda"
    if torch.backends.mps.is_available():
        return "mps"
    return "cpu"


def clear_accelerator_cache() -> None:
    gc.collect()
    if torch.backends.mps.is_available():
        torch.mps.empty_cache()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()


@contextmanager
def managed_model(loader: Callable[[], T]) -> Iterator[T]:
    """Load a model for a single batch stage and guarantee memory release on exit."""
    model = loader()
    try:
        yield model
    finally:
        del model
        clear_accelerator_cache()
